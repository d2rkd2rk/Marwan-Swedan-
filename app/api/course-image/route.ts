import {NextRequest,NextResponse} from 'next/server';
import {issueSignedToken,presignUrl} from '@vercel/blob';
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
  const expires=Date.now()+30*60*1000;
  const token=await issueSignedToken({pathname,operations:['get'],validUntil:expires});
  const {presignedUrl}=await presignUrl(token,{pathname,operation:'get',validUntil:expires,access:'private'});
  return NextResponse.redirect(presignedUrl,302);
 }catch(e:any){console.error('COURSE_IMAGE_ACCESS_FAILED',e);return new NextResponse('Image unavailable',{status:404})}
}