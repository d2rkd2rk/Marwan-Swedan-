import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireAdmin} from '@/lib/auth';
import {audit} from '@/lib/security';
import {ensurePathTables} from '@/lib/pathAccess';

export async function GET(request:Request){
 try{
  await requireAdmin(); await ensurePathTables();
  const pathId=new URL(request.url).searchParams.get('pathId');
  if(!pathId)return NextResponse.json({error:'pathId is required.'},{status:400});
  const rows=await db`select pc.id,pc.course_id,pc.position,c.title,c.slug,c.is_free,c.price,c.published,c.duration_minutes
    from path_courses pc join courses c on c.id=pc.course_id where pc.path_id=${pathId} order by pc.position asc`;
  return NextResponse.json({courses:rows});
 }catch(e:any){return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Authentication required'},{status:e.message==='FORBIDDEN'?403:401})}
}
export async function POST(request:Request){
 try{
  const admin=await requireAdmin(); await ensurePathTables();
  const b=await request.json(); const pathId=String(b.pathId||''),courseId=String(b.courseId||'');
  if(!pathId||!courseId)return NextResponse.json({error:'pathId and courseId are required.'},{status:400});
  const path=await db`select id from paths where id=${pathId} limit 1`; const course=await db`select id from courses where id=${courseId} limit 1`;
  if(!path.length||!course.length)return NextResponse.json({error:'Path or course not found.'},{status:404});
  const pos=await db`select coalesce(max(position),0)+1 as position from path_courses where path_id=${pathId}`;
  const rows=await db`insert into path_courses(path_id,course_id,position) values(${pathId},${courseId},${Number(pos[0].position)}) on conflict(path_id,course_id) do update set position=excluded.position returning *`;
  await audit(admin.id,'add_course_to_path',request,{pathId,courseId});
  return NextResponse.json({course:rows[0]},{status:201});
 }catch(e:any){return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Could not add course to path'},{status:e.message==='FORBIDDEN'?403:400})}
}
export async function PATCH(request:Request){
 try{
  const admin=await requireAdmin(); await ensurePathTables();
  const b=await request.json(); if(!b.pathId||!Array.isArray(b.orderedIds))return NextResponse.json({error:'pathId and orderedIds are required.'},{status:400});
  for(let i=0;i<b.orderedIds.length;i++)await db`update path_courses set position=${i+1} where id=${b.orderedIds[i]} and path_id=${b.pathId}`;
  await audit(admin.id,'reorder_path_courses',request,{pathId:b.pathId,count:b.orderedIds.length});
  return NextResponse.json({ok:true});
 }catch(e:any){return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Could not reorder path courses'},{status:e.message==='FORBIDDEN'?403:400})}
}
export async function DELETE(request:Request){
 try{
  const admin=await requireAdmin(); await ensurePathTables();
  const b=await request.json(); const pathId=String(b.pathId||''),courseId=String(b.courseId||'');
  if(!pathId||!courseId)return NextResponse.json({error:'pathId and courseId are required.'},{status:400});
  await db`delete from path_courses where path_id=${pathId} and course_id=${courseId}`;
  await audit(admin.id,'remove_course_from_path',request,{pathId,courseId});
  return NextResponse.json({ok:true});
 }catch(e:any){return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Could not remove course from path'},{status:e.message==='FORBIDDEN'?403:400})}
}
