import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireUser} from '@/lib/auth';
import {audit} from '@/lib/security';
import {ensureInstructorSchema, instructorHasCourse} from '@/lib/instructors';
import {sendRoleNotification} from '@/lib/push';

export async function GET() {
  try {
    const user = await requireUser();
    if (user.role !== 'instructor') return NextResponse.json({error:'Instructor access required.'},{status:403});
    await ensureInstructorSchema();
    const courses = await db`select c.id,c.title,c.slug,(select count(*)::int from enrollments e where e.course_id=c.id and e.revoked_at is null) as student_count from instructor_courses ic join courses c on c.id=ic.course_id where ic.user_id=${user.id} order by c.title asc`;
    return NextResponse.json({courses});
  } catch (e:any) {
    return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Authentication required.'},{status:e.message==='FORBIDDEN'?403:401});
  }
}

export async function POST(request:Request) {
  try {
    const user = await requireUser();
    if (user.role !== 'instructor') return NextResponse.json({error:'Instructor access required.'},{status:403});
    await ensureInstructorSchema();
    const body = await request.json();
    const courseId = String(body.courseId||'');
    const title = String(body.title||'').trim().slice(0,180);
    const fileName = String(body.fileName||'').trim().slice(0,255);
    const fileUrl = String(body.fileUrl||'').trim();
    if (!courseId || !title || !fileName || !fileUrl) return NextResponse.json({error:'Course, lesson title and video are required.'},{status:400});
    if (!(await instructorHasCourse(user.id,courseId))) return NextResponse.json({error:'You are not assigned to this course.'},{status:403});
    let key = '';
    try {
      const parsed = new URL(fileUrl,'https://provenra.invalid');
      key = parsed.searchParams.get('key')||'';
      if (parsed.origin !== 'https://provenra.invalid' || parsed.pathname !== '/api/file' || !key.startsWith(`courses/${courseId}/`) || key.split('/').length < 3 || key.split('/').some(part => part === '.' || part === '..')) throw new Error();
    } catch {
      return NextResponse.json({error:'Invalid video reference.'},{status:400});
    }
    const rows = await db`insert into instructor_uploads(instructor_id,course_id,title,file_url,file_name) values(${user.id},${courseId},${title},${fileUrl},${fileName}) returning id`;
    await audit(user.id,'submit_instructor_video',request,{uploadId:rows[0].id,courseId});
    try {
      await sendRoleNotification(
        'admin',
        'PROVENRA',
        'A new instructor video is waiting for review.',
        '/prv-7k9x4m2q/instructors',
        `instructor-review-${rows[0].id}`
      );
    } catch (pushError) {
      // Push delivery must never block an instructor video submission.
      console.error('INSTRUCTOR_REVIEW_PUSH_FAILED', pushError);
    }
    return NextResponse.json({ok:true,uploadId:rows[0].id},{status:201});
  } catch (e:any) {
    return NextResponse.json({error:e.message==='UNAUTHENTICATED'?'Authentication required.':'Could not submit video.'},{status:e.message==='UNAUTHENTICATED'?401:400});
  }
}
