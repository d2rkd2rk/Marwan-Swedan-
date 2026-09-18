import {NextRequest,NextResponse} from 'next/server';
import {GetObjectCommand,S3Client} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import db from '@/lib/db';
import {session} from '@/lib/auth';

export async function GET(request:NextRequest){
 try{
  const pathname=request.nextUrl.searchParams.get('pathname');
  if(!pathname||!pathname.startsWith('courses/'))return new NextResponse('Not found',{status:404});
  const parts=pathname.split('/');const courseId=parts[1];
  if(!courseId||parts.length<3)return new NextResponse('Not found',{status:404});
  const url=`/api/course-image?pathname=${encodeURIComponent(pathname)}`;
  const user=await session();
  const rows=await db`select published,thumbnail_url from courses where id=${courseId} limit 1`;
  if(!rows.length)return new NextResponse('Not found',{status:404});
  if(String(rows[0].thumbnail_url||'')!==url)return new NextResponse('Not found',{status:404});
  if(!rows[0].published&&user?.role!=='admin')return new NextResponse('Not found',{status:404});
  const accessKeyId=process.env.TIGRIS_STORAGE_ACCESS_KEY_ID;
  const secretAccessKey=process.env.TIGRIS_STORAGE_SECRET_ACCESS_KEY;
  const Bucket=process.env.TIGRIS_STORAGE_BUCKET;
  if(!accessKeyId||!secretAccessKey||!Bucket)throw new Error('TIGRIS_NOT_CONFIGURED');
  const client=new S3Client({region:'auto',endpoint:'https://t3.storage.dev',credentials:{accessKeyId,secretAccessKey}});
  const signedUrl=await getSignedUrl(client,new GetObjectCommand({Bucket,Key:pathname}),{expiresIn:30*60});
  return NextResponse.redirect(signedUrl,302);
 }catch(e:any){console.error('COURSE_IMAGE_ACCESS_FAILED',e?.message||e);return new NextResponse(e?.message==='TIGRIS_NOT_CONFIGURED'?'Tigris storage is not configured':'Image unavailable',{status:e?.message==='TIGRIS_NOT_CONFIGURED'?503:404})}
}