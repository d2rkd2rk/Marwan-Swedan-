import {NextRequest,NextResponse} from 'next/server';
import {GetObjectCommand,S3Client} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import db from '@/lib/db';
import {session} from '@/lib/auth';

function storage(){
  const accessKeyId=process.env.TIGRIS_STORAGE_ACCESS_KEY_ID;
  const secretAccessKey=process.env.TIGRIS_STORAGE_SECRET_ACCESS_KEY;
  const Bucket=process.env.TIGRIS_STORAGE_BUCKET;
  if(!accessKeyId||!secretAccessKey||!Bucket)throw new Error('TIGRIS_NOT_CONFIGURED');
  return {Bucket,client:new S3Client({region:'auto',endpoint:'https://t3.storage.dev',credentials:{accessKeyId,secretAccessKey},forcePathStyle:false})};
}

function extractKey(value:string){
  if(!value)return '';
  if(value.startsWith('/api/file?key=')){
    return decodeURIComponent(value.split('key=')[1]||'');
  }
  try{
    const u=new URL(value);
    const marker='/courses/';
    const i=u.pathname.indexOf(marker);
    return i>=0?u.pathname.slice(i+1):'';
  }catch{return value.startsWith('courses/')?value:''}
}

export async function GET(request:NextRequest,{params}:{params:Promise<{slug:string;lessonId:string}>}){
  try{
    const user=await session();
    if(!user)return new NextResponse('Authentication required',{status:401});
    const {slug,lessonId}=await params;
    const courseRows=await db`select id,is_free from courses where slug=${slug} and published=true limit 1`;
    if(!courseRows.length)return new NextResponse('Not found',{status:404});
    const course=courseRows[0] as any;
    const allowed=Boolean(course.is_free)||user.role==='admin'||Boolean((await db`select id from enrollments where user_id=${user.id} and course_id=${course.id} and revoked_at is null limit 1`).length);
    if(!allowed)return new NextResponse('Course access has not been granted.',{status:403});
    const lessons=await db`select video_url from lessons where id=${lessonId} and course_id=${course.id} and published=true limit 1`;
    if(!lessons.length)return new NextResponse('Not found',{status:404});
    const key=extractKey(String((lessons[0] as any).video_url||''));
    if(!key.startsWith(`courses/${course.id}/`))return new NextResponse('Video unavailable',{status:404});
    const {Bucket,client}=storage();
    const signedUrl=await getSignedUrl(client,new GetObjectCommand({Bucket,Key:key}),{expiresIn:60});
    const range=request.headers.get('range');
    const upstream=await fetch(signedUrl,{headers:range?{range}:{},cache:'no-store'});
    if(!upstream.ok||!upstream.body)return new NextResponse('Video unavailable',{status:upstream.status||404});
    const headers=new Headers();
    headers.set('Content-Type',upstream.headers.get('content-type')||'video/mp4');
    headers.set('Content-Length',upstream.headers.get('content-length')||'');
    headers.set('Accept-Ranges','bytes');
    headers.set('Cache-Control','private, no-store, max-age=0');
    headers.set('Content-Disposition','inline');
    const contentRange=upstream.headers.get('content-range');
    if(contentRange)headers.set('Content-Range',contentRange);
    return new NextResponse(upstream.body,{status:upstream.status,headers});
  }catch(e:any){
    console.error('PROTECTED_VIDEO_FAILED',e?.message||e);
    return new NextResponse(e?.message==='TIGRIS_NOT_CONFIGURED'?'Tigris storage is not configured':'Video unavailable',{status:e?.message==='TIGRIS_NOT_CONFIGURED'?503:404});
  }
}
