import {NextResponse} from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import {requireUser} from '@/lib/auth';
import {ensurePathTables,hasPathAccess} from '@/lib/pathAccess';

export async function GET(_:Request,{params}:{params:Promise<{slug:string}>}){
 try{
  const user=await requireUser(); await ensurePathTables();
  const {slug}=await params;
  const rows=await db`select id,title,description,published,is_free,certificate_enabled from paths where slug=${slug} limit 1`;
  if(!rows.length)return NextResponse.json({error:'Path not found.'},{status:404});
  const path=rows[0] as any;
  if(!path.certificate_enabled)return NextResponse.json({eligible:false,error:'Path certificates are disabled.'},{status:403});
  const pathAccess=user.role==='admin'||await hasPathAccess(user.id,path.id);
  if(!path.published&&!pathAccess)return NextResponse.json({error:'Path unavailable.'},{status:404});
  const access=pathAccess;
  if(!access)return NextResponse.json({error:'Path access required.'},{status:403});
  const courses=await db`select pc.course_id,count(l.id)::int as lesson_count,count(lp.lesson_id) filter(where lp.completed=true)::int as completed_count
    from path_courses pc join lessons l on l.course_id=pc.course_id and l.published=true
    left join lesson_progress lp on lp.lesson_id=l.id and lp.user_id=${user.id}
    where pc.path_id=${path.id} group by pc.course_id`;
  if(!courses.length||courses.some((c:any)=>Number(c.lesson_count)!==Number(c.completed_count)))return NextResponse.json({eligible:false},{status:200});
  await db`create table if not exists path_reviews(id uuid primary key default gen_random_uuid(),path_id uuid not null references paths(id) on delete cascade,user_id uuid not null references users(id) on delete cascade,rating smallint not null check(rating between 1 and 5),review text not null,created_at timestamptz not null default now(),unique(path_id,user_id))`;
  const reviewRows=await db`select review from path_reviews where user_id=${user.id} and path_id=${path.id} limit 1`;
  if(String(reviewRows[0]?.review||'').trim().length<5)return NextResponse.json({eligible:true,needsReview:true},{status:200});
  const existing=await db`select certificate_id,issued_at from path_certificates where user_id=${user.id} and path_id=${path.id} limit 1`;
  if(existing.length)return NextResponse.json({eligible:true,certificateId:existing[0].certificate_id,issuedAt:existing[0].issued_at});
  const certificateId=`PATH-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const created=await db`insert into path_certificates(certificate_id,user_id,path_id) values(${certificateId},${user.id},${path.id}) on conflict(user_id,path_id) do nothing returning certificate_id,issued_at`;
  if(created.length)return NextResponse.json({eligible:true,certificateId:created[0].certificate_id,issuedAt:created[0].issued_at});
  const retry=await db`select certificate_id,issued_at from path_certificates where user_id=${user.id} and path_id=${path.id} limit 1`;
  return NextResponse.json({eligible:true,certificateId:retry[0].certificate_id,issuedAt:retry[0].issued_at});
 }catch(e:any){return NextResponse.json({error:e.message==='UNAUTHENTICATED'?'Authentication required':'Could not issue path certificate.'},{status:e.message==='UNAUTHENTICATED'?401:400})}
}
