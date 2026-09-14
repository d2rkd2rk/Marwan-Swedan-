create table if not exists admin_bootstrap_lock(id integer primary key check(id=1),used_at timestamptz not null default now());
