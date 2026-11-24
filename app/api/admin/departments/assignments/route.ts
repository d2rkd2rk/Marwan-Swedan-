import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireAdmin} from '@/lib/auth';
import {audit} from '@/lib/security';
async function ensureDepartmentsSchema(){
 await db`create table if not exists course_departments(id uuid primary key default gen_random_uuid(),name text not null,position integer not null default 0,created_at timestamptz not null default now(),updated_at timestamptz not null default now())`;
 await db`create table if not exists course_department_assignments(id uuid primary key default gen_random_uuid(),course_id uuid not null references courses(id) on delete cascade,department_id uuid not null references course_departments(id) on delete cascade,created_at timestamptz not null default now(),unique(course_id,department_id))`;
 await db`create index if not exists course_department_assignments_department_idx on course_department_assignments(department_id,course_id)`;
}
export async function PUT(request:Request){try{
 const admin=await requireAdmin();await ensureDepartmentsSchema();const b=await request.json();const courseId=String(b.courseId||'');
 const departmentIds:string[]=Array.isArray(b.departmentIds)?Array.from(new Set<string>((b.departmentIds as unknown[]).map(id=>String(id)))):[];
 if(!courseId)return NextResponse.json({error:'Course id is required.'},{status:400});
 if(departmentIds.some(id=>! /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)))return NextResponse.json({error:'Invalid department selection.'},{status:400});
 const course=await db`select id from courses where id=${courseId} limit 1`;if(!course.length)return NextResponse.json({error:'Course not found.'},{status:404});
 const valid:string[]=[];for(const id of departmentIds){const row=await db`select id from course_departments where id=${id} limit 1`;if(row.length)valid.push(id)}
 if(valid.length!==departmentIds.length)return NextResponse.json({error:'One or more departments no longer exist. Refresh and try again.'},{status:400});
 await db.begin(async tx=>{await tx`delete from course_department_assignments where course_id=${courseId}`;for(const departmentId of departmentIds)await tx`insert into course_department_assignments(course_id,department_id) values(${courseId},${departmentId}) on conflict(course_id,department_id) do nothing`;});
 await audit(admin.id,'assign_course_departments',request,{courseId,departmentIds});return NextResponse.json({ok:true,departmentIds});
}catch(e:any){return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Could not save course departments.'},{status:e.message==='FORBIDDEN'?403:400})}}
