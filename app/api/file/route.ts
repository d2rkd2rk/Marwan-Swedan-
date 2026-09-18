import {NextRequest,NextResponse} from 'next/server';
import {issueSignedToken,presignUrl} from '@vercel/blob';
import db from '@/lib/db';
import {session} from '@/lib/auth';

function validPath(pathname:string){
 const parts=pathname.split('/');
 return parts.length>=3&&parts[0]==='courses'&&Boolean(parts[1]);
}

export async function GET(request:NextRequest){
 try{
  const pathname=request.nextUrl.searchParams.get('pathname');
  if(!pathname)return new NextResponse('Missing pathname',{status:400});
  if(!validPath(pathname))return new NextResponse('Not found',{status:404});

  const user=await session();
  if(!user)return new NextResponse('Authentication required',{status:401});

  const courseId=pathname.split('/')[1];
  const course=await db`select is_free from courses where id=${courseId} limit 1`;
  if(!course.length)return new NextResponse('Not found',{status:404});

  const enrollment=await db`select id from enrollments where user_id=${user.id} and course_id=${courseId} and revoked_at is null limit 1`;
  const allowed=Boolean(course[0].is_free)||Boolean(enrollment.length)||user.role==='admin';
  if(!allowed)return new NextResponse('Course access has not been granted.',{status:403});

  const validUntil=Date.now()+60*60*1000;
  const token=await issueSignedToken({pathname,operations:['get'],validUntil});
  const {presignedUrl}=await presignUrl(token,{pathname,operation:'get',validUntil,access:'private'});
  return NextResponse.redirect(presignedUrl,302);
 }catch(e:any){
  console.error('FILE_ACCESS_FAILED',e?.message||e);
  return new NextResponse('File unavailable',{status:404});
 }
}
