create table if not exists course_certificates(
  id uuid primary key default gen_random_uuid(),
  certificate_id text not null unique,
  user_id uuid not null references users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  issued_at timestamptz not null default now(),
  unique(user_id,course_id)
);
create index if not exists course_certificates_course_idx on course_certificates(course_id,issued_at desc);
create index if not exists course_certificates_user_idx on course_certificates(user_id,issued_at desc);
