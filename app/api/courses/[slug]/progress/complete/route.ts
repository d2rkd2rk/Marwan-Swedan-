import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireUser} from '@/lib/auth';

async function ensureProgressColumns(){
  await db`alter table lesson_progress add column if not exists progress_seconds integer not null default 0`;
  await db`alter table lesson_progress add column if not exists last_viewed_at timestamptz`;
}

async function getCourseAccess(userId:string,slug:string){
  const rows=await db`select id,is_free from courses where slug=${slug} and published=true limit 1`;
  if(!rows.length)return null;
  const course=rows[0] as any;
  if(course.is_free)return course;
  const access=await db`select id from enrollments where user_id=${userId} and course_id=${course.id} and revoked_at is null limit 1`;
  return access.length?course:null;
}

export async function POST(request:Request,{params}:{params:Promise<{slug:string}>}){
  try{
    const user=await requireUser();
    await ensureProgressColumns();
    const {slug}=await params;
    const course=await getCourseAccess(user.id,slug);
    if(!course)return NextResponse.json({error:'Course access required.'},{status:403});

    const body=await request.json();
    const lessonId=String(body.lessonId||'');
    if(!lessonId)return NextResponse.json({error:'lessonId is required.'},{status:400});

    const seconds=Math.max(0,Math.floor(Number(body.progressSeconds||0)));
    const lesson=await db`select id from lessons where id=${lessonId} and course_id=${course.id} and published=true limit 1`;
    if(!lesson.length)return NextResponse.json({error:'Lesson not found.'},{status:404});

    const rows=await db`insert into lesson_progress(user_id,lesson_id,completed,progress_seconds,last_viewed_at,updated_at)
      values(${user.id},${lessonId},true,${seconds},now(),now())
      on conflict(user_id,lesson_id) do update set
        completed=true,
        progress_seconds=greatest(lesson_progress.progress_seconds,excluded.progress_seconds),
        last_viewed_at=now(),
        updated_at=now()
      returning lesson_id,completed,progress_seconds,updated_at,last_viewed_at`;

    return NextResponse.json({progress:rows[0]},{status:200});
  }catch(e:any){
    console.error('MARK_LESSON_COMPLETE_FAILED',e);
    return NextResponse.json({error:'Could not save lesson completion.'},{status:500});
  }
}
