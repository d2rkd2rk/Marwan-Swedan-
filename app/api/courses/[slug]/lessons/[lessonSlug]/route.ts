import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {session} from '@/lib/auth';
import {audit} from '@/lib/security';
export async function GET(request:Request,{params}:{params:Promise<{slug:string,lessonSlug:string}>}){
  const {slug,lessonSlug}=await params;
  const user=await session();
  if(!user)return NextResponse.json({error:'Authentication required.'},{status:401});
  const rows=await db`select l.id,l.title,l.slug,l.position,l.duration_minutes,l.video_url,l.file_url,l.file_name,l.content,c.id as course_id,c.title as course_title,c.slug as course_slug from lessons l join courses c on c.id=l.course_id where c.slug=${slug} and l.slug=${lessonSlug} and l.published=true limit 1`;
  const lesson=rows[0] as any;
  if(!lesson)return NextResponse.json({error:'Lesson not found.'},{status:404});
  const access=await db`select id from enrollments where user_id=${user.id} and course_id=${lesson.course_id} and revoked_at is null limit 1`;
  const course=await db`select is_free from courses where id=${lesson.course_id} limit 1`;
  const allowed=Boolean(course[0]?.is_free)||Boolean(access.length)||user.role==='admin';
  if(!allowed)return NextResponse.json({error:'Course access has not been granted.'},{status:403});
  await audit(user.id,'lesson_view',request,{lessonId:lesson.id,courseId:lesson.course_id});
  return NextResponse.json({lesson});
}