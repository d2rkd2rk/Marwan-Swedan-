import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireUser} from '@/lib/auth';
import {ensurePathTables,hasCourseAccess} from '@/lib/pathAccess';

export async function GET(_:Request,{params}:{params:Promise<{slug:string}>}){
  try{
    const user=await requireUser();
    const {slug}=await params;
    if(!process.env.DATABASE_URL)return NextResponse.json({error:'Database is not configured.'},{status:503});
    const rows=await db`select id,title,slug,description,category,level,duration_minutes,thumbnail_url,ai_context,is_free,price,published from courses where slug=${slug} and published=true limit 1`;
    const course=rows[0] as any;
    if(!course)return NextResponse.json({error:'Course not found.'},{status:404});
    await ensurePathTables();
    const isAdmin=user.role==='admin';
    let enrolled=course.is_free||isAdmin;
    if(!enrolled)enrolled=await hasCourseAccess(user.id,course.id);
    const lessons=await db`select id,title,slug,position,duration_minutes,published,video_url,file_url,file_name from lessons where course_id=${course.id} and published=true order by position asc`;
    const safeLessons=enrolled?lessons:lessons.map((l:any)=>({id:l.id,title:l.title,slug:l.slug,position:l.position,duration_minutes:l.duration_minutes,published:l.published}));
    let progress:any[]=[];
    if(enrolled){
      await db`alter table lesson_progress add column if not exists progress_seconds integer not null default 0`;
      await db`alter table lesson_progress add column if not exists last_viewed_at timestamptz`;
      progress=await db`select lp.lesson_id,lp.completed,lp.progress_seconds,lp.updated_at,lp.last_viewed_at from lesson_progress lp join lessons l on l.id=lp.lesson_id where lp.user_id=${user.id} and l.course_id=${course.id}`;
    }
    return NextResponse.json({course:{...course,ai_context:undefined},lessons:safeLessons,progress,enrolled,requiresPurchase:!course.is_free&&!enrolled});
  }catch(e:any){return NextResponse.json({error:'Authentication required'},{status:401})}
}
