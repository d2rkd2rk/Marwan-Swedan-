import {NextRequest,NextResponse} from 'next/server';
import {issueSignedToken,presignUrl} from '@vercel/blob';
import db from '@/lib/db';
import {session} from '@/lib/auth';

export async function GET(request:NextRequest){
 try{
  const pathname=request.nextUrl.searchParams.get('pathname');
  if(!pathname)return new NextResponse('Missing pathname',{status:400});
  const parts=pathname.split('/');
  if(!parts[0]||!parts[1])return new NextResponse('Not found',{status:404});
  const user=await session();
  if(!user)return new NextResponse('Authentication required',{status:401});
  if(parts[0]==='profiles'){
   if(parts[1]!==user.id&&user.role!=='admin')return new NextResponse('Forbidden',{status:403});
  }else if(parts[0]==='courses'){
   let courseId=parts[1];
   if(courseId==='uploads'){
    const lesson=await db`select course_id from lessons where file_url=${`/api/file?pathname=${encodeURIComponent(pathname)}`} limit 1`;
    if(!lesson.length)return new NextResponse('Not found',{status:404});
    courseId=lesson[0].course_id;
   }
   let allowed=user.role==='admin';
   if(!allowed){
    const rows=await db`select c.is_free,exists(select 1 from enrollments e where e.course_id=c.id and e.user_id=${user.id} and e.revoked_at is null) as enrolled from courses c where c.id=${courseId} and c.published=true`;
    if(!rows.length)return new NextResponse('Not found',{status:404});
    allowed=Boolean(rows[0].is_free)||Boolean(rows[0].enrolled);
   }
   if(!allowed)return new NextResponse('Forbidden',{status:403});
  }else return new NextResponse('Not found',{status:404});
  const expires=Date.now()+10*60*1000;
  const token=await issueSignedToken({pathname,operations:['get'],validUntil:expires});
  const {presignedUrl}=await presignUrl(token,{pathname,operation:'get',validUntil:expires,access:'private'});
  return NextResponse.redirect(presignedUrl,302);
 }catch(e:any){console.error('FILE_ACCESS_FAILED',e);return new NextResponse('File unavailable',{status:404})}
}