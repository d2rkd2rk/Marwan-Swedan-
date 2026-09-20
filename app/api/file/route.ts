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

function validKey(key:string){
  const parts=key.split('/');
  return parts.length>=3&&parts[0]==='courses'&&Boolean(parts[1]);
}

export async function GET(request:NextRequest){
 try{
  const key=request.nextUrl.searchParams.get('key');
  if(!key||!validKey(key))return new NextResponse('Not found',{status:404});

  const user=await session();
  if(!user)return new NextResponse('Authentication required',{status:401});

  const courseId=key.split('/')[1];
  const isThumbnail=courseId==='course-thumbnails';
  if(!isThumbnail){
    const course=await db`select is_free from courses where id=${courseId} limit 1`;
    if(!course.length)return new NextResponse('Not found',{status:404});
    const enrollment=await db`select id from enrollments where user_id=${user.id} and course_id=${courseId} and revoked_at is null limit 1`;
    const allowed=Boolean(course[0].is_free)||Boolean(enrollment.length)||user.role==='admin';
    if(!allowed)return new NextResponse('Course access has not been granted.',{status:403});
  }

  const {Bucket,client}=storage();
  const signedUrl=await getSignedUrl(
    client,
    new GetObjectCommand({Bucket,Key:key}),
    {expiresIn:10*60}
  );
  return NextResponse.redirect(signedUrl,{status:302});
 }catch(e:any){
  console.error('FILE_ACCESS_FAILED',e?.message||e);
  return new NextResponse(e?.message==='TIGRIS_NOT_CONFIGURED'?'Tigris storage is not configured':'File unavailable',{status:e?.message==='TIGRIS_NOT_CONFIGURED'?503:404});
 }
}
