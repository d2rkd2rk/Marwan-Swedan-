import {NextRequest,NextResponse} from 'next/server';
import {GetObjectCommand,S3Client} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import db from '@/lib/db';
import {requireAdmin} from '@/lib/auth';
import {audit} from '@/lib/security';

function storage(){
  const accessKeyId=process.env.TIGRIS_STORAGE_ACCESS_KEY_ID;
  const secretAccessKey=process.env.TIGRIS_STORAGE_SECRET_ACCESS_KEY;
  const Bucket=process.env.TIGRIS_STORAGE_BUCKET;
  if(!accessKeyId||!secretAccessKey||!Bucket)throw new Error('TIGRIS_NOT_CONFIGURED');
  return {
    Bucket,
    client:new S3Client({
      region:'auto',
      endpoint:'https://t3.storage.dev',
      credentials:{accessKeyId,secretAccessKey},
      forcePathStyle:false
    })
  };
}

function getStoredObjectKey(values:unknown[],courseId:string,baseUrl:string){
  for(const value of values){
    if(typeof value!=='string'||!value.trim())continue;
    try{
      // Only the local file endpoint is accepted. The host is intentionally ignored:
      // older records may contain an absolute academy URL from a previous domain.
      // We never fetch that URL; only its key is used with the configured private bucket.
      const fileUrl=new URL(value,baseUrl);
      if(fileUrl.pathname!=='/api/file')continue;
      const key=fileUrl.searchParams.get('key')||'';
      const parts=key.split('/');
      if(!key.startsWith(`courses/${courseId}/`)||parts.length<3)continue;
      if(parts.some(part=>!part||part==='.'||part==='..'||/[\\\\\u0000-\u001f]/.test(part)))continue;
      return key;
    }catch{
      continue;
    }
  }
  return null;
}

export async function GET(request:NextRequest){
  try{
    const admin=await requireAdmin();
    const lessonId=request.nextUrl.searchParams.get('lessonId');
    if(!lessonId)return new NextResponse('Lesson id is required.',{status:400});

    const rows=await db`select id,course_id,title,file_url,video_url,file_name from lessons where id=${lessonId} limit 1`;
    const lesson=rows[0] as any;
    if(!lesson)return new NextResponse('Lesson not found.',{status:404});

    const key=getStoredObjectKey([lesson.file_url,lesson.video_url],String(lesson.course_id),request.url);
    if(!key)return new NextResponse('No downloadable video is stored for this lesson.',{status:404});

    const rawName=String(lesson.file_name||lesson.title||'lesson-video').trim()||'lesson-video';
    const fileName=rawName.replace(/[\\\\/\u0000-\u001f\u007f"]/g,'_')||'lesson-video';
    const asciiName=fileName.replace(/[^\x20-\x7E]/g,'_').replace(/[\\\\"]/g,'_')||'lesson-video';
    const encodedName=encodeURIComponent(fileName).replace(/[!'()*]/g,char=>`%${char.charCodeAt(0).toString(16).toUpperCase()}`);
    const disposition=`attachment; filename="${asciiName}"; filename*=UTF-8''${encodedName}`;

    const {Bucket,client}=storage();
    const signedUrl=await getSignedUrl(
      client,
      new GetObjectCommand({Bucket,Key:key,ResponseContentDisposition:disposition}),
      {expiresIn:10*60}
    );
    await audit(admin.id,'download_lesson_file',request,{lessonId:lesson.id,courseId:lesson.course_id});
    return NextResponse.redirect(signedUrl,{status:302,headers:{'Cache-Control':'private, no-store'}});
  }catch(e:any){
    console.error('ADMIN_LESSON_DOWNLOAD_FAILED',e?.message||e);
    const status=e?.message==='FORBIDDEN'?403:e?.message==='UNAUTHENTICATED'?401:e?.message==='TIGRIS_NOT_CONFIGURED'?503:500;
    const message=status===403?'Forbidden':status===401?'Authentication required':status===503?'Storage is not configured.':'Could not prepare lesson download.';
    return new NextResponse(message,{status,headers:{'Cache-Control':'private, no-store'}});
  }
}
