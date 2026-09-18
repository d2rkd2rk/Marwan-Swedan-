import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireUser} from '@/lib/auth';

async function ensureProgressColumns(){
  await db`alter table lesson_progress add column if not exists progress_seconds integer not null default 0`;
  await db`alter table lesson_progress add column if not exists last_viewed_at timestamptz`;
}

async function getCourseAccess(userId:string, slug:string){
  const rows=await db`select id,is_free from courses where slug=${slug} and published=true limit 1`;
  if(!rows.length)return null;
  const course=rows[0] as any;
  if(course.is_free)return course;
  const access=await db`select id from enrollments where user_id=${userId} and course_id=${course.id} and revoked_at is null limit 1`;
  return access.length?course:null;
}

export async function GET(_:Request,{params}:{params:Promise<{slug:string}>}){
  try{
    const user=await requireUser();
    await ensureProgressColumns();
    const {slug}=await params;
    const course=await getCourseAccess(user.id,slug);
    if(!course)return NextResponse.json({error:'Course access required.'},{status:403});
    const rows=await db`select lp.lesson_id,lp.completed,lp.progress_seconds,lp.updated_at,lp.last_viewed_at
      from lesson_progress lp
      join lessons l on l.id=lp.lesson_id
      where lp.user_id=${user.id} and l.course_id=${course.id}
      order by lp.updated_at desc`;
    return NextResponse.json({progress:rows});
  }catch(e:any){
    return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Authentication required'},{status:e.message==='FORBIDDEN'?403:401});
  }
}

export async function PUT(request:Request,{params}:{params:Promise<{slug:string}>}){
  try{
    const user=await requireUser();
    await ensureProgressColumns();
    const {slug}=await params;
    const course=await getCourseAccess(user.id,slug);
    if(!course)return NextResponse.json({error:'Course access required.'},{status:403});
    const body=await request.json();
    const lessonId=String(body.lessonId||'');
    if(!lessonId)return NextResponse.json({error:'lessonId is required.'},{status:400});
    const lesson=await db`select id from lessons where id=${lessonId} and course_id=${course.id} and published=true limit 1`;
    if(!lesson.length)return NextResponse.json({error:'Lesson not found.'},{status:404});
    const seconds=Math.max(0,Math.floor(Number(body.progressSeconds||0)));
    const completed=Boolean(body.completed);
    const rows=await db`insert into lesson_progress(user_id,lesson_id,completed,progress_seconds,last_viewed_at,updated_at)
      values(${user.id},${lessonId},${completed},${seconds},now(),now())
      on conflict(user_id,lesson_id) do update set
        completed=lesson_progress.completed or excluded.completed,
        progress_seconds=excluded.progress_seconds,
        last_viewed_at=now(),
        updated_at=now()
      returning lesson_id,completed,progress_seconds,updated_at,last_viewed_at`;
    return NextResponse.json({progress:rows[0]});
  }catch(e:any){
    console.error('SAVE_LESSON_PROGRESS_FAILED',e);
    return NextResponse.json({error:'Could not save lesson progress.'},{status:400});
  }
}
