alter table courses add column if not exists is_free boolean not null default true;
alter table courses add column if not exists price numeric(10,2) not null default 0 check(price>=0);
alter table lessons add column if not exists file_url text;
alter table lessons add column if not exists file_name text;
delete from courses where slug in ('soc-foundations','digital-forensics','python-cybersecurity');