import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireUser} from '@/lib/auth';
import {ensurePathTables,hasPathAccess} from '@/lib/pathAccess';

export async function GET(){
 try{
  const user=await requireUser(); await ensurePathTables();
  const rows=await db`select p.id,p.title,p.slug,p.description,p.category,p.level,p.thumbnail_url,p.is_free,p.price,p.published,p.whatsapp_number,
    exists(select 1 from path_enrollments pe where pe.path_id=p.id and pe.user_id=${user.id} and pe.revoked_at is null) as enrolled,
    count(pc.course_id)::int as course_count,coalesce(sum(c.duration_minutes),0)::int as duration_minutes
    from paths p left join path_courses pc on pc.path_id=p.id left join courses c on c.id=pc.course_id
    where p.published=true group by p.id order by p.created_at desc`;
  return NextResponse.json({paths:rows});
 }catch(e:any){return NextResponse.json({error:'Authentication required'},{status:401})}
}
