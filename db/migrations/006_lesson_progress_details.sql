alter table lesson_progress add column if not exists progress_seconds integer not null default 0;
alter table lesson_progress add column if not exists last_viewed_at timestamptz;
create index if not exists lesson_progress_user_idx on lesson_progress(user_id,updated_at desc);
