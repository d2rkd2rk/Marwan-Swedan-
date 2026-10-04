import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireUser} from '@/lib/auth';
import {ensurePathTables,hasPathAccess,hasCourseAccess} from '@/lib/pathAccess';

export async function GET(_:Request,{params}:{params:Promise<{slug:string}>}){
 try{
  const user=await requireUser(); await ensurePathTables();
  const {slug}=await params;
  const rows=await db`select id,title,slug,description,category,level,thumbnail_url,is_free,price,published,whatsapp_number from paths where slug=${slug} and published=true limit 1`;
  if(!rows.length)return NextResponse.json({error:'Path not found.'},{status:404});
  const path=rows[0] as any;
  const enrolled=path.is_free||user.role==='admin'||await hasPathAccess(user.id,path.id);
  const courses=await db`select pc.id as path_course_id,pc.course_id,pc.position,c.title,c.slug,c.description,c.category,c.level,c.duration_minutes,c.thumbnail_url,c.is_free,c.price,c.published
    from path_courses pc join courses c on c.id=pc.course_id where pc.path_id=${path.id} and c.published=true order by pc.position asc`;
  const resultCourses=await Promise.all(courses.map(async(c:any)=>{
    const accessible=enrolled||user.role==='admin'||await hasCourseAccess(user.id,c.course_id);
    const total=await db`select count(*)::int as count from lessons where course_id=${c.course_id} and published=true`;
    const done=accessible?await db`select count(*)::int as count from lesson_progress lp join lessons l on l.id=lp.lesson_id where lp.user_id=${user.id} and l.course_id=${c.course_id} and l.published=true and lp.completed=true`:[{count:0}];
    return {...c,accessible,total_lessons:Number(total[0]?.count||0),completed_lessons:Number(done[0]?.count||0),progress:Number(total[0]?.count?Math.round(Number(done[0].count)/Number(total[0].count)*100):0)};
  }));
  const allDone=enrolled&&resultCourses.length>0&&resultCourses.every(c=>c.progress===100);
  const cert=allDone?await db`select certificate_id,issued_at from path_certificates where user_id=${user.id} and path_id=${path.id} limit 1`:[];
  return NextResponse.json({path, enrolled, courses:resultCourses,complete:allDone,certificate:cert[0]||null});
 }catch(e:any){return NextResponse.json({error:e.message==='UNAUTHENTICATED'?'Authentication required':'Could not load path.'},{status:e.message==='UNAUTHENTICATED'?401:500})}
}
