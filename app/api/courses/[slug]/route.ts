import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {session} from '@/lib/auth';

export async function GET(_:Request,{params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  if(!process.env.DATABASE_URL)return NextResponse.json({error:'Database is not configured.'},{status:503});
  const user=await session();
  const rows=await db`select id,title,slug,description,category,level,duration_minutes,thumbnail_url,ai_context,published from courses where slug=${slug} and published=true limit 1`;
  const course=rows[0] as any;
  if(!course)return NextResponse.json({error:'Course not found.'},{status:404});
  let enrolled=false;
  if(user) {const access=await db`select id from enrollments where user_id=${user.id} and course_id=${course.id} and revoked_at is null limit 1`;enrolled=access.length>0||user.role==='admin'}
  const lessons=await db`select id,title,slug,position,duration_minutes,published from lessons where course_id=${course.id} and published=true order by position asc`;
  return NextResponse.json({course:{...course,ai_context:undefined},lessons,enrolled});
}