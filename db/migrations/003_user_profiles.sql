alter table users add column if not exists bio text not null default '';
alter table users add column if not exists avatar_url text;
alter table users add column if not exists cv_url text;
alter table users add column if not exists cv_name text;
