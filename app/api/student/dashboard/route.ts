import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireUser} from '@/lib/auth';

export async function GET(){
  try{
    const user=await requireUser();
    const [courses,certificates]=await Promise.all([
      db`select c.id,c.title,c.slug,c.description,c.category,c.level,c.duration_minutes,c.thumbnail_url,c.is_free,c.price,c.published,e.created_at as enrolled_at from enrollments e join courses c on c.id=e.course_id where e.user_id=${user.id} and e.revoked_at is null order by e.created_at desc`,
      db`select cc.certificate_id,cc.issued_at,c.id as course_id,c.title as course_title from course_certificates cc join courses c on c.id=cc.course_id where cc.user_id=${user.id} order by cc.issued_at desc`
    ]);
    return NextResponse.json({courses,certificates});
  }catch(e:any){
    return NextResponse.json({error:e.message==='UNAUTHENTICATED'?'Authentication required':'Could not load dashboard.'},{status:e.message==='UNAUTHENTICATED'?401:500});
  }
}
