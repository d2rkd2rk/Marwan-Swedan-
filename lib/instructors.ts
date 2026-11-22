import db from '@/lib/db';

let schemaPromise: Promise<void> | null = null;

export function ensureInstructorSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await db.begin(async tx => {
        await tx`select pg_advisory_xact_lock(7710182027)`;
        const roleConstraint = await tx`select pg_get_constraintdef(oid) as definition from pg_constraint where conrelid='users'::regclass and conname='users_role_check'`;
        if (!roleConstraint.length) {
          await tx`alter table users add constraint users_role_check check (role in ('student','admin','instructor'))`;
        } else if (!String(roleConstraint[0].definition).includes('instructor')) {
          await tx`alter table users drop constraint users_role_check`;
          await tx`alter table users add constraint users_role_check check (role in ('student','admin','instructor'))`;
        }
      });
      await db`create table if not exists instructor_courses (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references users(id) on delete cascade,
        course_id uuid not null references courses(id) on delete cascade,
        created_at timestamptz not null default now(),
        unique(user_id, course_id)
      )`;
      await db`create index if not exists instructor_courses_user_idx on instructor_courses(user_id, created_at desc)`;
      await db`create index if not exists instructor_courses_course_idx on instructor_courses(course_id)`;
      await db`create table if not exists instructor_uploads (
        id uuid primary key default gen_random_uuid(),
        instructor_id uuid not null references users(id) on delete cascade,
        course_id uuid not null references courses(id) on delete cascade,
        title text not null,
        file_url text not null,
        file_name text not null,
        status text not null default 'pending' check (status in ('pending','approved','rejected')),
        lesson_id uuid references lessons(id) on delete set null,
        reviewed_by uuid references users(id) on delete set null,
        reviewed_at timestamptz,
        created_at timestamptz not null default now()
      )`;
      await db`create index if not exists instructor_uploads_status_idx on instructor_uploads(status, created_at desc)`;
      await db`create index if not exists instructor_uploads_instructor_idx on instructor_uploads(instructor_id, created_at desc)`;
    })().catch(error => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}

export async function instructorHasCourse(userId: string, courseId: string) {
  await ensureInstructorSchema();
  const rows = await db`select 1 from instructor_courses where user_id=${userId} and course_id=${courseId} limit 1`;
  return rows.length > 0;
}
