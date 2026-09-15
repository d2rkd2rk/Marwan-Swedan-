import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {adminEmail,createRandomToken,hashPassword,hashToken} from '@/lib/auth';

export async function POST(request:Request){
  try{
    const secret=process.env.ADMIN_BOOTSTRAP_SECRET||'';
    if(!secret||request.headers.get('x-admin-bootstrap-secret')!==secret)return NextResponse.json({error:'Forbidden'},{status:403});
    if(!process.env.DATABASE_URL)return NextResponse.json({error:'Database is not configured on the server.'},{status:503});

    // Keep the one-time bootstrap flow usable even if the database schema was not
    // fully initialized yet. No credential is persisted in the repository.
    await db`create extension if not exists pgcrypto`;
    await db`create table if not exists users(
      id uuid primary key default gen_random_uuid(),
      name text not null,
      email text not null unique,
      whatsapp text not null,
      username text not null unique,
      password_hash text not null,
      role text not null default 'student' check(role in('student','admin')),
      is_blocked boolean not null default false,
      blocked_until timestamptz,
      created_at timestamptz not null default now(),
      last_login_at timestamptz
    )`;
    await db`create table if not exists admin_login_links(
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references users(id) on delete cascade,
      token_hash text not null unique,
      expires_at timestamptz not null,
      used_at timestamptz,
      created_at timestamptz not null default now()
    )`;

    let rows=await db`select id from users where lower(email)=lower(${adminEmail}) and role='admin' limit 1`;
    if(!rows.length){
      const existing=await db`select id,role from users where lower(email)=lower(${adminEmail}) limit 1`;
      if(existing.length)return NextResponse.json({error:'The administrator email already belongs to a non-admin account.'},{status:409});
      const bootstrapPasswordHash=await hashPassword(createRandomToken());
      rows=await db`insert into users(name,email,whatsapp,username,password_hash,role) values('Marwan Swedan',${adminEmail},'201515227612','marwan_swedan',${bootstrapPasswordHash},'admin') returning id`;
    }

    await db`delete from admin_login_links where used_at is not null or expires_at<=now()`;
    const raw=createRandomToken();
    await db`insert into admin_login_links(user_id,token_hash,expires_at) values(${rows[0].id},${hashToken(raw)},now()+interval '15 minutes')`;
    const base=(process.env.NEXT_PUBLIC_SITE_URL||'').replace(/\/$/,'');
    if(!base)return NextResponse.json({error:'Site URL is not configured.'},{status:503});
    return NextResponse.json({url:`${base}/api/auth/admin-login?token=${encodeURIComponent(raw)}`});
  }catch(error){
    console.error('admin-login-link generation failed',error);
    return NextResponse.json({error:'Unable to create login link. Check the database configuration/schema and try again.'},{status:500});
  }
}