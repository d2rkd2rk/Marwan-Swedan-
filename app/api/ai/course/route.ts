import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {session} from '@/lib/auth';
import {askCourseAI} from '@/lib/ai';
export async function POST(request:Request){
  const user=await session();
  if(!user)return NextResponse.json({error:'Authentication required.'},{status:401});
  const {slug,question}=await request.json();
  if(!slug||typeof question!=='string'||question.trim().length<2||question.length>1000)return NextResponse.json({error:'Invalid question.'},{status:400});
  const rows=await db`select id,title,description,category,level,duration_minutes,ai_context from courses where slug=${String(slug)} and published=true limit 1`;
  const course=rows[0] as any;
  if(!course)return NextResponse.json({error:'Course not found.'},{status:404});
  const access=await db`select id from enrollments where user_id=${user.id} and course_id=${course.id} and revoked_at is null limit 1`;
  if(!access.length&&user.role!=='admin')return NextResponse.json({error:'Course access has not been granted.'},{status:403});
  const lessons=await db`select title,duration_minutes,position from lessons where course_id=${course.id} and published=true order by position asc`;
  const context=JSON.stringify({course,lessons});
  return NextResponse.json(await askCourseAI(question.trim(),context));
}