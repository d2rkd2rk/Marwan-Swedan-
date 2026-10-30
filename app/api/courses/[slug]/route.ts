import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireUser} from '@/lib/auth';
import {ensurePathTables,hasCourseAccess,hasCourseAccessViaPath,hasStandaloneCourseAccess} from '@/lib/pathAccess';

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
    let enrolled=isAdmin;
    if(!enrolled)enrolled=await hasCourseAccess(user.id,course.id);
    const lessons=await db`select id,title,slug,position,duration_minutes,published,video_url,file_url,file_name from lessons where course_id=${course.id} and published=true order by position asc`;
    const safeLessons=enrolled?lessons:lessons.map((l:any)=>({id:l.id,title:l.title,slug:l.slug,position:l.position,duration_minutes:l.duration_minutes,published:l.published}));
    let progress:any[]=[];
    if(enrolled){
      await db`alter table lesson_progress add column if not exists progress_seconds integer not null default 0`;
      await db`alter table lesson_progress add column if not exists last_viewed_at timestamptz`;
      await db`create table if not exists lesson_watch_state(user_id uuid not null references users(id) on delete cascade,lesson_id uuid not null references lessons(id) on delete cascade,watch_ranges jsonb not null default '[]'::jsonb,duration_seconds integer not null default 0,last_position real,last_heartbeat_at timestamptz,session_id text,updated_at timestamptz not null default now(),primary key(user_id,lesson_id))`;
      const rows=await db`select lp.lesson_id,lp.completed,lp.progress_seconds,lp.updated_at,lp.last_viewed_at,coalesce(ws.watch_ranges,'[]'::jsonb) as watch_ranges,coalesce(ws.duration_seconds,0) as duration_seconds from lesson_progress lp join lessons l on l.id=lp.lesson_id left join lesson_watch_state ws on ws.lesson_id=lp.lesson_id and ws.user_id=lp.user_id where lp.user_id=${user.id} and l.course_id=${course.id}`;
      progress=rows.map((row:any)=>{const ranges=Array.isArray(row.watch_ranges)?row.watch_ranges:[];const watchedSeconds=ranges.reduce((sum:number,r:any)=>sum+Math.max(0,Number(r[1])-Number(r[0])),0);return {...row,watched_seconds:Math.floor(watchedSeconds),watch_percent:row.duration_seconds?Math.min(100,Math.floor(watchedSeconds/row.duration_seconds*100)):0,watch_ranges:undefined}});
    }
    const certificateBlockedByPath=!isAdmin&&!(await hasStandaloneCourseAccess(user.id,course.id))&&await hasCourseAccessViaPath(user.id,course.id);
    return NextResponse.json({course:{...course,ai_context:undefined},lessons:safeLessons,progress,enrolled,requiresPurchase:!course.is_free&&!enrolled,certificateBlockedByPath});
  }catch(e:any){return NextResponse.json({error:'Authentication required'},{status:401})}
}

export async function POST(_:Request,{params}:{params:Promise<{slug:string}>}){try{const user=await requireUser();const {slug}=await params;const rows=await db`select id,is_free,published from courses where slug=${slug} limit 1`;const course=rows[0] as any;if(!course||!course.published)return NextResponse.json({error:'Course not found.'},{status:404});if(!course.is_free)return NextResponse.json({error:'Paid courses require admin-granted access.'},{status:403});await ensurePathTables();await db`insert into enrollments(user_id,course_id,granted_by,source) values(${user.id},${course.id},null,'free') on conflict(user_id,course_id) do update set revoked_at=null,source=case when enrollments.source='admin' and enrollments.revoked_at is null then 'admin' else 'free' end`;return NextResponse.json({ok:true,enrolled:true})}catch(e:any){return NextResponse.json({error:e.message==='UNAUTHENTICATED'?'Authentication required':'Could not enroll in course.'},{status:401})}}
