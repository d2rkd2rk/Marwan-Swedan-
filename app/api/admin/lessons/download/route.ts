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

export async function GET(request:NextRequest){
  try{
    const admin=await requireAdmin();
    await db`alter table lessons add column if not exists file_url text`;
    await db`alter table lessons add column if not exists file_name text`;

    const lessonId=request.nextUrl.searchParams.get('lessonId');
    if(!lessonId)return new NextResponse('Lesson id is required.',{status:400});

    const rows=await db`select id,course_id,title,file_url,video_url,file_name from lessons where id=${lessonId} limit 1`;
    const lesson=rows[0] as any;
    const storedFileUrl=lesson?.file_url||lesson?.video_url;
    if(!storedFileUrl)return new NextResponse('Stored lesson file not found.',{status:404});

    const fileUrl=new URL(String(storedFileUrl),request.url);
    if(fileUrl.origin!==new URL(request.url).origin||fileUrl.pathname!=='/api/file')return new NextResponse('Invalid lesson file reference.',{status:404});
    const key=fileUrl.searchParams.get('key')||'';
    if(!key.startsWith(`courses/${lesson.course_id}/`)||key.split('/').length<3)return new NextResponse('Invalid lesson file reference.',{status:404});

    const fileName=String(lesson.file_name||lesson.title||'lesson-video').trim()||'lesson-video';
    const fallbackName=fileName.replace(/[\r\n"]/g,'')||'lesson-video';
    const disposition=`attachment; filename="${fallbackName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
    const {Bucket,client}=storage();
    const signedUrl=await getSignedUrl(
      client,
      new GetObjectCommand({Bucket,Key:key,ResponseContentDisposition:disposition}),
      {expiresIn:5*60}
    );
    await audit(admin.id,'download_lesson_file',request,{lessonId:lesson.id,courseId:lesson.course_id});
    return NextResponse.redirect(signedUrl,{status:302,headers:{'Cache-Control':'no-store'}});
  }catch(e:any){
    console.error('ADMIN_LESSON_DOWNLOAD_FAILED',e?.message||e);
    const status=e?.message==='FORBIDDEN'?403:e?.message==='UNAUTHENTICATED'?401:e?.message==='TIGRIS_NOT_CONFIGURED'?503:500;
    const message=status===403?'Forbidden':status===401?'Authentication required':status===503?'Storage is not configured.':'Could not prepare lesson download.';
    return new NextResponse(message,{status,headers:{'Cache-Control':'no-store'}});
  }
}
