import db from '@/lib/db';

export async function ensurePathTables(){
  await db`create table if not exists paths(
    id uuid primary key default gen_random_uuid(),
    title text not null default 'Untitled Path',
    slug text not null unique,
    description text not null default '',
    category text not null default 'Cybersecurity',
    level text not null default 'Beginner',
    thumbnail_url text,
    is_free boolean not null default true,
    price numeric(10,2) not null default 0,
    published boolean not null default false,
    whatsapp_number text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`;
  await db`create table if not exists path_courses(
    id uuid primary key default gen_random_uuid(),
    path_id uuid not null references paths(id) on delete cascade,
    course_id uuid not null references courses(id) on delete cascade,
    position integer not null default 1,
    created_at timestamptz not null default now(),
    unique(path_id,course_id)
  )`;
  await db`create table if not exists path_enrollments(
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    path_id uuid not null references paths(id) on delete cascade,
    granted_by uuid references users(id),
    created_at timestamptz not null default now(),
    revoked_at timestamptz,
    unique(user_id,path_id)
  )`;
  await db`create table if not exists path_certificates(
    id uuid primary key default gen_random_uuid(),
    certificate_id text not null unique,
    user_id uuid not null references users(id) on delete cascade,
    path_id uuid not null references paths(id) on delete cascade,
    issued_at timestamptz not null default now(),
    unique(user_id,path_id)
  )`;
  await db`create index if not exists path_courses_path_idx on path_courses(path_id,position)`;
  await db`create index if not exists path_courses_course_idx on path_courses(course_id,path_id)`;
  await db`create index if not exists path_enrollments_user_idx on path_enrollments(user_id,revoked_at)`;
  await db`create index if not exists path_enrollments_path_idx on path_enrollments(path_id,revoked_at)`;
  await db`create index if not exists path_certificates_user_idx on path_certificates(user_id,issued_at desc)`;
  await db`create index if not exists path_certificates_path_idx on path_certificates(path_id,issued_at desc)`;
}

export async function hasPathAccess(userId:string,pathId:string){
  await ensurePathTables();
  const rows=await db`select id from path_enrollments where user_id=${userId} and path_id=${pathId} and revoked_at is null limit 1`;
  return rows.length>0;
}

export async function hasCourseAccess(userId:string,courseId:string){
  await ensurePathTables();
  const direct=await db`select id from enrollments where user_id=${userId} and course_id=${courseId} and revoked_at is null limit 1`;
  if(direct.length)return true;
  const path=await db`select 1 from path_enrollments pe join path_courses pc on pc.path_id=pe.path_id where pe.user_id=${userId} and pe.revoked_at is null and pc.course_id=${courseId} limit 1`;
  return path.length>0;
}

export async function getPathCourseIds(pathId:string){
  await ensurePathTables();
  const rows=await db`select course_id from path_courses where path_id=${pathId} order by position asc`;
  return rows.map((r:any)=>String(r.course_id));
}
