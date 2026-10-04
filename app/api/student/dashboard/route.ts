import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireUser} from '@/lib/auth';
import {ensurePathTables} from '@/lib/pathAccess';

export async function GET(){
  try{
    const user=await requireUser();
    if(user.role==='admin')return NextResponse.json({error:'Student dashboard is not available for admins.'},{status:403});
    await ensurePathTables();
    const [courses,certificates,paths,pathCertificates]=await Promise.all([
      db`select c.id,c.title,c.slug,c.description,c.category,c.level,c.duration_minutes,c.thumbnail_url,c.is_free,c.price,c.published,e.created_at as enrolled_at from enrollments e join courses c on c.id=e.course_id where e.user_id=${user.id} and e.revoked_at is null order by e.created_at desc`,
      db`select cc.certificate_id,cc.issued_at,c.id as course_id,c.title as course_title from course_certificates cc join courses c on c.id=cc.course_id where cc.user_id=${user.id} order by cc.issued_at desc`,
      db`select p.id,p.title,p.slug,p.description,p.thumbnail_url,p.is_free,p.price,pe.created_at as enrolled_at,
        count(pc.course_id)::int as course_count,coalesce(sum(c.duration_minutes),0)::int as duration_minutes
        from path_enrollments pe join paths p on p.id=pe.path_id left join path_courses pc on pc.path_id=p.id left join courses c on c.id=pc.course_id
        where pe.user_id=${user.id} and pe.revoked_at is null and p.published=true group by p.id,pe.created_at order by pe.created_at desc`,
      db`select pc.certificate_id,pc.issued_at,p.id as path_id,p.title as path_title from path_certificates pc join paths p on p.id=pc.path_id where pc.user_id=${user.id} order by pc.issued_at desc`
    ]);
    return NextResponse.json({courses,certificates,paths,pathCertificates});
  }catch(e:any){
    return NextResponse.json({error:e.message==='UNAUTHENTICATED'?'Authentication required':'Could not load dashboard.'},{status:e.message==='UNAUTHENTICATED'?401:500});
  }
}
