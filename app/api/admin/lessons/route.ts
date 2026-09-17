import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireAdmin} from '@/lib/auth';
import {head} from '@vercel/blob';
import {audit} from '@/lib/security';

async function ensureMediaColumns(){
  await db`alter table lessons add column if not exists file_url text`;
  await db`alter table lessons add column if not exists file_name text`;
}
function makeSlug(value:string){const base=value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');return base||`lesson-${Date.now()}`}
async function uniqueSlug(courseId:string,raw:string,id?:string){const base=makeSlug(raw);const rows=id?await db`select id from lessons where course_id=${courseId} and slug=${base} and id<>${id} limit 1`:await db`select id from lessons where course_id=${courseId} and slug=${base} limit 1`;return rows.length?`${base}-${Date.now().toString().slice(-6)}`:base}

async function verifyFile(fileUrl:string|null){
  if(!fileUrl)return null;
  const marker='/api/file?pathname=';
  if(!fileUrl.startsWith(marker))throw new Error('INVALID_FILE_URL');
  const pathname=decodeURIComponent(fileUrl.slice(marker.length));
  if(!pathname.startsWith('courses/')||pathname.split('/').length<3)throw new Error('INVALID_FILE_PATH');
  try{
    const blob=await head(pathname);
    if(!blob?.pathname)throw new Error('BLOB_NOT_FOUND');
    return pathname;
  }catch(e:any){
    console.error('VERIFY_BLOB_FAILED',e?.message||e);
    throw new Error('BLOB_NOT_FOUND');
  }
}

export async function GET(request:Request){try{await requireAdmin();await ensureMediaColumns();const courseId=new URL(request.url).searchParams.get('courseId');if(!courseId)return NextResponse.json({error:'courseId is required'},{status:400});return NextResponse.json({lessons:await db`select * from lessons where course_id=${courseId} order by position asc`})}catch(e:any){return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Authentication required'},{status:e.message==='FORBIDDEN'?403:401})}}

export async function POST(request:Request){try{const admin=await requireAdmin();await ensureMediaColumns();const b=await request.json();const courseId=String(b.courseId||'');const title=String(b.title||'').trim();if(!courseId||!title)return NextResponse.json({error:'Course and lesson title are required.'},{status:400});const fileUrl=b.fileUrl?String(b.fileUrl):null;await verifyFile(fileUrl);const slug=await uniqueSlug(courseId,String(b.slug||title));const rows=await db`insert into lessons(course_id,title,slug,position,duration_minutes,video_url,file_url,file_name,content,published) values(${courseId},${title},${slug},${Number(b.position||0)},${Math.max(0,Number(b.durationMinutes||0))},${b.videoUrl||null},${fileUrl},${b.fileName||null},${b.content||''},${Boolean(b.published)}) returning *`;await audit(admin.id,'create_lesson',request,{lessonId:rows[0].id});return NextResponse.json({lesson:rows[0]},{status:201})}catch(e:any){console.error('CREATE_LESSON_FAILED',e);const message=e.message==='BLOB_NOT_FOUND'?'The upload did not finish or the file could not be found in storage. Please upload it again.':e.message==='INVALID_FILE_URL'||e.message==='INVALID_FILE_PATH'?'Invalid course file reference.':e.message==='FORBIDDEN'?'Forbidden':'Could not create lesson';return NextResponse.json({error:message},{status:e.message==='FORBIDDEN'?403:400})}}

export async function PUT(request:Request){try{const admin=await requireAdmin();await ensureMediaColumns();const b=await request.json();const id=String(b.id||'');const courseId=String(b.courseId||'');const title=String(b.title||'').trim();if(!id||!courseId||!title)return NextResponse.json({error:'Lesson id, course and title are required.'},{status:400});const fileUrl=b.fileUrl?String(b.fileUrl):null;await verifyFile(fileUrl);const slug=await uniqueSlug(courseId,String(b.slug||title),id);const rows=await db`update lessons set title=${title},slug=${slug},position=${Number(b.position||0)},duration_minutes=${Math.max(0,Number(b.durationMinutes||0))},video_url=${b.videoUrl||null},file_url=${fileUrl},file_name=${b.fileName||null},content=${b.content||''},published=${Boolean(b.published)} where id=${id} and course_id=${courseId} returning *`;if(!rows.length)return NextResponse.json({error:'Lesson not found'},{status:404});await audit(admin.id,'update_lesson',request,{lessonId:id});return NextResponse.json({lesson:rows[0]})}catch(e:any){console.error('UPDATE_LESSON_FAILED',e);const message=e.message==='BLOB_NOT_FOUND'?'The upload did not finish or the file could not be found in storage. Please upload it again.':e.message==='INVALID_FILE_URL'||e.message==='INVALID_FILE_PATH'?'Invalid course file reference.':e.message==='FORBIDDEN'?'Forbidden':'Could not update lesson';return NextResponse.json({error:message},{status:e.message==='FORBIDDEN'?403:400})}}

export async function PATCH(request:Request){try{const admin=await requireAdmin();const b=await request.json();if(!b.courseId||!Array.isArray(b.orderedIds))return NextResponse.json({error:'courseId and orderedIds are required'},{status:400});for(let i=0;i<b.orderedIds.length;i++)await db`update lessons set position=${i+1} where id=${b.orderedIds[i]} and course_id=${b.courseId}`;await audit(admin.id,'reorder_lessons',request,{courseId:b.courseId,count:b.orderedIds.length});return NextResponse.json({ok:true})}catch(e:any){return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Could not reorder lessons'},{status:e.message==='FORBIDDEN'?403:400})}}

export async function DELETE(request:Request){try{const admin=await requireAdmin();const {id}=await request.json();await db`delete from lessons where id=${id}`;await audit(admin.id,'delete_lesson',request,{lessonId:id});return NextResponse.json({ok:true})}catch(e:any){return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Could not delete lesson'},{status:e.message==='FORBIDDEN'?403:400})}}
