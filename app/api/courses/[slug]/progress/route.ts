import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireUser} from '@/lib/auth';
import {ensurePathTables,hasCourseAccess} from '@/lib/pathAccess';

function parseWatchRanges(value:unknown):any[]{
  if(Array.isArray(value))return value;
  if(typeof value==='string'){
    try{const parsed=JSON.parse(value);return Array.isArray(parsed)?parsed:[];}catch{return [];}
  }
  return [];
}

async function ensureProgressColumns(){
  await db`alter table lesson_progress add column if not exists progress_seconds integer not null default 0`;
  await db`alter table lesson_progress add column if not exists last_viewed_at timestamptz`;
  await db`create table if not exists lesson_watch_state(user_id uuid not null references users(id) on delete cascade,lesson_id uuid not null references lessons(id) on delete cascade,watch_ranges jsonb not null default '[]'::jsonb,duration_seconds integer not null default 0,last_position real,last_heartbeat_at timestamptz,session_id text,updated_at timestamptz not null default now(),primary key(user_id,lesson_id))`;
}

async function getCourseAccess(userId:string, slug:string){
  const rows=await db`select id,is_free from courses where slug=${slug} and published=true limit 1`;
  if(!rows.length)return null;
  const course=rows[0] as any;
  const user=await db`select role from users where id=${userId} limit 1`;
  if((user[0] as any)?.role==='admin')return course;
  await ensurePathTables();
  return (await hasCourseAccess(userId,course.id))?course:null;
}

export async function GET(_:Request,{params}:{params:Promise<{slug:string}>}){
  try{
    const user=await requireUser();
    await ensureProgressColumns();
    const {slug}=await params;
    const course=await getCourseAccess(user.id,slug);
    if(!course)return NextResponse.json({error:'Course access required.'},{status:403});
    const rows=await db`select lp.lesson_id,lp.completed,lp.progress_seconds,lp.updated_at,lp.last_viewed_at,coalesce(ws.watch_ranges,'[]'::jsonb) as watch_ranges,coalesce(ws.duration_seconds,0) as duration_seconds
      from lesson_progress lp
      join lessons l on l.id=lp.lesson_id
      left join lesson_watch_state ws on ws.lesson_id=lp.lesson_id and ws.user_id=lp.user_id
      where lp.user_id=${user.id} and l.course_id=${course.id}
      order by lp.updated_at desc`;
    const progress=rows.map((row:any)=>{const ranges=parseWatchRanges(row.watch_ranges);const watchedSeconds=ranges.reduce((sum:number,r:any)=>sum+Math.max(0,Number(r[1])-Number(r[0])),0);return {...row,watched_seconds:Math.floor(watchedSeconds),watch_percent:row.duration_seconds?Math.min(100,Math.floor(watchedSeconds/row.duration_seconds*100)):0,watch_ranges:undefined}});
    return NextResponse.json({progress});
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
    const lesson=await db`select id,duration_minutes,video_url,file_url,file_name from lessons where id=${lessonId} and course_id=${course.id} and published=true limit 1`;
    if(!lesson.length)return NextResponse.json({error:'Lesson not found.'},{status:404});
    const seconds=Math.max(0,Math.floor(Number(body.progressSeconds||0)));
    if(body.eventType==='heartbeat'){
      const position=Number(body.currentTime);
      const duration=Number(body.duration);
      const sessionId=String(body.sessionId||'').slice(0,100);
      const playbackRate=Number(body.playbackRate||1);
      if(!Number.isFinite(position)||!Number.isFinite(duration)||duration<=0||position<0||position>duration+1||!sessionId||!Number.isFinite(playbackRate)||playbackRate<0.25||playbackRate>2){
        return NextResponse.json({error:'Invalid playback heartbeat.'},{status:400});
      }
      const existing=await db`select watch_ranges,duration_seconds,last_position,last_heartbeat_at,session_id from lesson_watch_state where user_id=${user.id} and lesson_id=${lessonId} limit 1`;
      let ranges:any[]=parseWatchRanges((existing[0] as any)?.watch_ranges);
      let added=0;
      const previous=existing[0] as any;
      if(previous&&previous.session_id===sessionId&&previous.last_position!==null&&previous.last_heartbeat_at){
        const elapsed=Math.max(0,Math.min(60,(Date.now()-new Date(previous.last_heartbeat_at).getTime())/1000));
        const delta=position-Number(previous.last_position);
        if(delta>0&&delta<=elapsed*Math.min(2,playbackRate)*1.2+1){
          const nextStart=Math.max(0,Number(previous.last_position));
          const nextEnd=Math.min(duration,position);
          if(nextEnd>nextStart){
            const merged=[...ranges.map((r:any)=>[Number(r[0]),Number(r[1])]),[nextStart,nextEnd]].sort((a,b)=>a[0]-b[0]);
            ranges=[];
            for(const range of merged){
              const last=ranges[ranges.length-1];
              if(last&&range[0]<=last[1]+0.25)last[1]=Math.max(last[1],range[1]);
              else ranges.push(range);
            }
            added=nextEnd-nextStart;
          }
        }
      }
      const safeRanges=ranges.filter((r:any)=>Array.isArray(r)&&r.length===2&&Number.isFinite(Number(r[0]))&&Number.isFinite(Number(r[1]))&&Number(r[1])>Number(r[0])).map((r:any)=>[Math.max(0,Number(r[0])),Math.min(duration,Number(r[1]))]);
      const watchRows=await db`insert into lesson_watch_state(user_id,lesson_id,watch_ranges,duration_seconds,last_position,last_heartbeat_at,session_id,updated_at)
        values(${user.id},${lessonId},${JSON.stringify(safeRanges)}::jsonb,${Math.round(duration)},${position},now(),${sessionId},now())
        on conflict(user_id,lesson_id) do update set watch_ranges=excluded.watch_ranges,duration_seconds=greatest(lesson_watch_state.duration_seconds,excluded.duration_seconds),last_position=excluded.last_position,last_heartbeat_at=now(),session_id=excluded.session_id,updated_at=now()
        returning watch_ranges,duration_seconds`;
      const savedRanges=parseWatchRanges((watchRows[0] as any)?.watch_ranges);
      const watchedSeconds=savedRanges.reduce((sum:number,r:any)=>sum+Math.max(0,Number(r[1])-Number(r[0])),0);
      const progressRows=await db`insert into lesson_progress(user_id,lesson_id,completed,progress_seconds,last_viewed_at,updated_at)
        values(${user.id},${lessonId},false,${Math.floor(position)},now(),now())
        on conflict(user_id,lesson_id) do update set progress_seconds=greatest(lesson_progress.progress_seconds,excluded.progress_seconds),last_viewed_at=now(),updated_at=now()
        returning lesson_id,completed,progress_seconds,updated_at,last_viewed_at`;
      return NextResponse.json({progress:progressRows[0],watchProgress:{watchedSeconds:Math.floor(watchedSeconds),durationSeconds:Number((watchRows[0] as any)?.duration_seconds||duration),percent:Math.min(100,Math.floor(watchedSeconds/Math.max(1,duration)*100)),addedSeconds:Math.floor(added)}});
    }
    const isVideo=Boolean((lesson[0] as any).video_url)||/\.(mp4|webm|ogg|mov|m4v)(?:[?#]|$)/i.test(String((lesson[0] as any).file_url||''))||/\.(mp4|webm|ogg|mov|m4v)$/i.test(String((lesson[0] as any).file_name||''));
    if(body.completed&&isVideo){
      const watch=await db`select watch_ranges,duration_seconds from lesson_watch_state where user_id=${user.id} and lesson_id=${lessonId} limit 1`;
      const ranges=parseWatchRanges((watch[0] as any)?.watch_ranges);
      const duration=Number((watch[0] as any)?.duration_seconds||0);
      const watched=ranges.reduce((sum:number,r:any)=>sum+Math.max(0,Number(r[1])-Number(r[0])),0);
      if(!duration||watched<duration*0.7)return NextResponse.json({error:'Watch at least 70% of this video before marking it complete.',watchProgress:{watchedSeconds:Math.floor(watched),durationSeconds:duration,percent:duration?Math.floor(watched/duration*100):0},requiredPercent:70},{status:403});
    }
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
