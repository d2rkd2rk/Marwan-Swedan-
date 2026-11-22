import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireAdmin} from '@/lib/auth';
import {audit} from '@/lib/security';
import {sendCourseNotification} from '@/lib/push';
import {ensureInstructorSchema} from '@/lib/instructors';

export async function GET() {
  try {
    await requireAdmin();
    await ensureInstructorSchema();
    const [instructors, assignments, uploads] = await Promise.all([
      db`select id,name,email,username from users where role='instructor' order by name asc`,
      db`select ic.id,ic.user_id,ic.course_id,ic.created_at,u.name,u.email,u.username,c.title as course_title from instructor_courses ic join users u on u.id=ic.user_id join courses c on c.id=ic.course_id order by ic.created_at desc`,
      db`select iu.id,iu.title,iu.file_url,iu.file_name,iu.status,iu.created_at,u.name as instructor_name,u.username,c.title as course_title,c.id as course_id from instructor_uploads iu join users u on u.id=iu.instructor_id join courses c on c.id=iu.course_id order by case when iu.status='pending' then 0 else 1 end,iu.created_at desc limit 200`
    ]);
    const [users,courses] = await Promise.all([
      db`select id,name,email,username,role from users where role<>'admin' order by created_at desc`,
      db`select id,title,published from courses order by title asc`
    ]);
    return NextResponse.json({instructors,assignments,uploads,users,courses});
  } catch(e:any) {
    return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Authentication required.'},{status:e.message==='FORBIDDEN'?403:401});
  }
}

export async function POST(request:Request) {
  try {
    const admin = await requireAdmin();
    await ensureInstructorSchema();
    const body = await request.json();
    const action = String(body.action||'');
    const userId = String(body.userId||'');
    const courseId = String(body.courseId||'');
    if (!userId || !courseId) return NextResponse.json({error:'Account and course are required.'},{status:400});
    if (action === 'assign') {
      const target = await db`select id,role from users where id=${userId} limit 1`;
      if (!target.length || target[0].role==='admin') return NextResponse.json({error:'This account cannot be assigned as an instructor.'},{status:400});
      const course = await db`select id from courses where id=${courseId} limit 1`;
      if (!course.length) return NextResponse.json({error:'Course not found.'},{status:404});
      await db`update users set role='instructor' where id=${userId} and role in ('student','instructor')`;
      await db`insert into instructor_courses(user_id,course_id) values(${userId},${courseId}) on conflict(user_id,course_id) do nothing`;
      await audit(admin.id,'assign_instructor_course',request,{userId,courseId});
      return NextResponse.json({ok:true});
    }
    if (action === 'revoke') {
      await db`delete from instructor_courses where user_id=${userId} and course_id=${courseId}`;
      const remaining = await db`select 1 from instructor_courses where user_id=${userId} limit 1`;
      if (!remaining.length) await db`update users set role='student' where id=${userId} and role='instructor'`;
      await audit(admin.id,'revoke_instructor_course',request,{userId,courseId});
      return NextResponse.json({ok:true});
    }
    return NextResponse.json({error:'Invalid action.'},{status:400});
  } catch(e:any) {
    return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Could not update instructor access.'},{status:e.message==='FORBIDDEN'?403:400});
  }
}

export async function PATCH(request:Request) {
  try {
    const admin = await requireAdmin();
    await ensureInstructorSchema();
    const body = await request.json();
    const uploadId = String(body.uploadId||'');
    const action = String(body.action||'');
    if (!uploadId || !['approve','reject'].includes(action)) return NextResponse.json({error:'A video and review action are required.'},{status:400});
    const pending = await db`select iu.*,c.title as course_title from instructor_uploads iu join courses c on c.id=iu.course_id where iu.id=${uploadId} and iu.status='pending' limit 1`;
    if (!pending.length) return NextResponse.json({error:'Pending video not found.'},{status:404});
    const upload = pending[0] as any;
    if (action === 'reject') {
      await db`update instructor_uploads set status='rejected',reviewed_by=${admin.id},reviewed_at=now() where id=${uploadId} and status='pending'`;
      await audit(admin.id,'reject_instructor_video',request,{uploadId,courseId:upload.course_id});
      return NextResponse.json({ok:true});
    }
    const slugBase = String(upload.title).toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') || 'lesson';
    let lessonId = '';
    await db.begin(async tx => {
      const positionRows = await tx`select coalesce(max(position),0)::int+1 as position from lessons where course_id=${upload.course_id}`;
      const existing = await tx`select id from lessons where course_id=${upload.course_id} and slug=${slugBase} limit 1`;
      const slug = existing.length ? `${slugBase}-${Date.now().toString().slice(-6)}` : slugBase;
      const lessons = await tx`insert into lessons(course_id,title,slug,position,duration_minutes,file_url,file_name,content,published) values(${upload.course_id},${upload.title},${slug},${positionRows[0].position},0,${upload.file_url},${upload.file_name},'',true) returning id`;
      lessonId = String(lessons[0].id);
      await tx`update instructor_uploads set status='approved',lesson_id=${lessonId},reviewed_by=${admin.id},reviewed_at=now() where id=${uploadId} and status='pending'`;
    });
    await audit(admin.id,'approve_instructor_video',request,{uploadId,lessonId,courseId:upload.course_id});
    void sendCourseNotification(String(upload.course_id),String(upload.title)).catch(()=>{});
    return NextResponse.json({ok:true,lessonId});
  } catch(e:any) {
    return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Could not review video.'},{status:e.message==='FORBIDDEN'?403:400});
  }
}
