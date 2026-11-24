import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {session} from '@/lib/auth';
async function ensureDepartmentsSchema(){
 await db`create table if not exists course_departments(id uuid primary key default gen_random_uuid(),name text not null,position integer not null default 0,created_at timestamptz not null default now(),updated_at timestamptz not null default now())`;
 await db`create table if not exists course_department_assignments(id uuid primary key default gen_random_uuid(),course_id uuid not null references courses(id) on delete cascade,department_id uuid not null references course_departments(id) on delete cascade,created_at timestamptz not null default now(),unique(course_id,department_id))`;
 await db`create index if not exists course_department_assignments_course_idx on course_department_assignments(course_id,department_id)`;
}
export async function GET(){try{
 if(!process.env.DATABASE_URL)return NextResponse.json({courses:[]});
 await ensureDepartmentsSchema();const user=await session();
 if(user){
  await db`alter table courses add column if not exists whatsapp_number text`;
  const courses=await db`select c.id,c.title,c.slug,c.description,c.category,c.level,c.duration_minutes,c.thumbnail_url,c.is_free,c.price,c.published,c.whatsapp_number,case when e.id is not null and e.revoked_at is null then true else false end as enrolled,coalesce((select json_agg(json_build_object('id',d.id,'name',d.name) order by d.position,d.name) from course_department_assignments a join course_departments d on d.id=a.department_id where a.course_id=c.id),'[]'::json) as departments from courses c left join enrollments e on e.course_id=c.id and e.user_id=${user.id} where c.published=true order by c.created_at desc`;
  return NextResponse.json({courses});
 }
 const courses=await db`select c.id,c.title,c.slug,c.category,c.level,c.duration_minutes,c.thumbnail_url,c.is_free,c.price,c.published,coalesce((select json_agg(json_build_object('id',d.id,'name',d.name) order by d.position,d.name) from course_department_assignments a join course_departments d on d.id=a.department_id where a.course_id=c.id),'[]'::json) as departments from courses c where c.published=true order by c.created_at desc`;
 return NextResponse.json({courses});
}catch(e:any){console.error('PUBLIC_COURSE_LIST_FAILED',e);return NextResponse.json({error:'Could not load courses.'},{status:500})}}
