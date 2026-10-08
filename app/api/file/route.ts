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
  if(parts.length>=3&&(['courses','course-thumbnails','path-thumbnails'].includes(parts[0]))&&Boolean(parts[1]))return true;
  return parts.length===4&&parts[0]==='profiles'&&Boolean(parts[1])&&(['avatar','cv'].includes(parts[2]));
}

export async function GET(request:NextRequest){
 try{
  const key=request.nextUrl.searchParams.get('key');
  if(!key||!validKey(key))return new NextResponse('Not found',{status:404});

  const parts=key.split('/');
  const isPublicAvatar=parts[0]==='profiles'&&parts[2]==='avatar';
  const isProfileCv=parts[0]==='profiles'&&parts[2]==='cv';
  const isPublicThumbnailNamespace=parts[0]==='course-thumbnails'||parts[0]==='path-thumbnails';

  // Older thumbnails were accidentally saved in the private "courses" namespace.
  // Only make a legacy object public when its exact URL is registered as a published course thumbnail.
  const thumbnailUrl=`/api/file?key=${encodeURIComponent(key)}`;
  const legacyThumbnail=parts[0]==='courses'
    ?await db`select published from courses where thumbnail_url=${thumbnailUrl} limit 1`
    :[];
  const isLegacyCourseThumbnail=legacyThumbnail.length>0;
  const isPublishedLegacyThumbnail=Boolean(legacyThumbnail[0]?.published);
  const isPublicThumbnail=isPublicThumbnailNamespace||isPublishedLegacyThumbnail;
  const isPublicMedia=isPublicAvatar||isPublicThumbnail;
  const user=isPublicMedia?null:await session();
  if(!isPublicMedia&&!user)return new NextResponse('Authentication required',{status:401});
  if(isProfileCv&&user?.id!==parts[1]&&user?.role!=='admin')return new NextResponse('Forbidden',{status:403});
  if(isLegacyCourseThumbnail&&!isPublishedLegacyThumbnail&&user?.role!=='admin')return new NextResponse('Not found',{status:404});

  const courseId=parts[1];
  if(!isPublicMedia&&!isProfileCv&&!isLegacyCourseThumbnail){
    const course=await db`select is_free from courses where id=${courseId} limit 1`;
    if(!course.length)return new NextResponse('Not found',{status:404});
    const enrollment=await db`select id from enrollments where user_id=${user!.id} and course_id=${courseId} and revoked_at is null limit 1`;
    const allowed=Boolean(course[0].is_free)||Boolean(enrollment.length)||user!.role==='admin';
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
