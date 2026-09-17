import {NextRequest,NextResponse} from 'next/server';
import {get} from '@vercel/blob';
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
  const owner=String(rows[0].thumbnail_url||'')===url;
  if(!owner)return new NextResponse('Not found',{status:404});
  if(!rows[0].published&&user?.role!=='admin')return new NextResponse('Not found',{status:404});
  const result=await get(pathname,{access:'private'});
  if(!result||result.statusCode!==200)return new NextResponse('Not found',{status:404});
  return new NextResponse(result.stream,{headers:{'Content-Type':result.blob.contentType,'X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=3600, stale-while-revalidate=86400','ETag':result.blob.etag}});
 }catch{return new NextResponse('Image unavailable',{status:404})}
}
