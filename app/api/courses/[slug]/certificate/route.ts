import {NextResponse} from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import {requireUser} from '@/lib/auth';

async function ensureCertificateFlag(){await db`alter table courses add column if not exists certificate_enabled boolean not null default false`}

async function ensureCertificateTable(){
  await db`create table if not exists course_certificates(id uuid primary key default gen_random_uuid(),certificate_id text not null unique,user_id uuid not null references users(id) on delete cascade,course_id uuid not null references courses(id) on delete cascade,issued_at timestamptz not null default now(),unique(user_id,course_id))`;
  await db`create index if not exists course_certificates_course_idx on course_certificates(course_id,issued_at desc)`;
  await db`create index if not exists course_certificates_user_idx on course_certificates(user_id,issued_at desc)`;
}

async function getEligible(userId:string,slug:string){
  const rows=await db`select id,title,slug from courses where slug=${slug} and published=true and certificate_enabled=true limit 1`;
  if(!rows.length)return null;
  const course=rows[0] as any;
  const lessons=await db`select l.id,l.duration_minutes,coalesce(lp.completed,false) as completed,coalesce(lp.progress_seconds,0) as progress_seconds
    from lessons l
    left join lesson_progress lp on lp.lesson_id=l.id and lp.user_id=${userId}
    where l.course_id=${course.id} and l.published=true
    order by l.position asc`;
  if(!lessons.length||lessons.some((l:any)=>!l.completed))return {course,eligible:false};
  return {course,eligible:true};
}

export async function GET(_:Request,{params}:{params:Promise<{slug:string}>}){
  try{
    const user=await requireUser();
    await ensureCertificateFlag();
    await ensureCertificateTable();
    const {slug}=await params;
    const result=await getEligible(user.id,slug);
    if(!result)return NextResponse.json({error:'Course not found.'},{status:404});
    if(!result.eligible)return NextResponse.json({eligible:false},{status:200});
    const existing=await db`select certificate_id,issued_at from course_certificates where user_id=${user.id} and course_id=${result.course.id} limit 1`;
    if(existing.length)return NextResponse.json({eligible:true,certificateId:existing[0].certificate_id,issuedAt:existing[0].issued_at});
    const certificateId=`MS-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const created=await db`insert into course_certificates(certificate_id,user_id,course_id) values(${certificateId},${user.id},${result.course.id}) on conflict(user_id,course_id) do nothing returning certificate_id,issued_at`;
    if(created.length)return NextResponse.json({eligible:true,certificateId:created[0].certificate_id,issuedAt:created[0].issued_at});
    const retry=await db`select certificate_id,issued_at from course_certificates where user_id=${user.id} and course_id=${result.course.id} limit 1`;
    return NextResponse.json({eligible:true,certificateId:retry[0].certificate_id,issuedAt:retry[0].issued_at});
  }catch(e:any){
    return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Authentication required'},{status:e.message==='FORBIDDEN'?403:401});
  }
}
