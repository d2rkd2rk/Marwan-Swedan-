import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireAdmin} from '@/lib/auth';
import {audit} from '@/lib/security';
import {sendCourseAnnouncement} from '@/lib/push';

export async function POST(request:Request){
 try{
  const admin=await requireAdmin();
  const b=await request.json();
  const courseId=String(b.courseId||'').trim();
  const title=String(b.title||'').trim();
  const body=String(b.body||'').trim();
  if(!courseId||!title||!body)return NextResponse.json({error:'Course, announcement title and message are required.'},{status:400});
  if(title.length>120)return NextResponse.json({error:'Announcement title must be 120 characters or fewer.'},{status:400});
  if(body.length>1000)return NextResponse.json({error:'Announcement message must be 1000 characters or fewer.'},{status:400});
  const courses=await db`select id,title,published from courses where id=${courseId} limit 1`;
  if(!courses.length)return NextResponse.json({error:'Course not found.'},{status:404});
  if(!courses[0].published)return NextResponse.json({error:'Publish the course before sending announcements.'},{status:400});
  const sent=await sendCourseAnnouncement(courseId,title,body);
  await audit(admin.id,'send_course_announcement',request,{courseId,title});
  return NextResponse.json({ok:true,sent});
 }catch(e:any){
  console.error('SEND_COURSE_ANNOUNCEMENT_FAILED',e);
  const status=e.message==='FORBIDDEN'?403:e.message==='ANNOUNCEMENT_REQUIRED'||e.message==='PUSH_NOT_CONFIGURED'?400:401;
  return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':e.message==='ANNOUNCEMENT_REQUIRED'?'Announcement title and message are required.':e.message==='PUSH_NOT_CONFIGURED'?'Push notifications are not configured on the server.':'Could not send announcement.'},{status});
 }
}