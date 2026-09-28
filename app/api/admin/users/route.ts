import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireAdmin} from '@/lib/auth';
export async function GET(request:Request){
  try{
    await requireAdmin();
    await db`alter table users add column if not exists password_change_allowed boolean not null default false`;
    const q=(new URL(request.url).searchParams.get('q')||'').trim();
    const rows=q
      ? await db`select id,name,email,whatsapp,username,role,is_blocked,blocked_until,created_at,last_login_at,password_change_allowed from users where name ilike ${'%'+q+'%'} or email ilike ${'%'+q+'%'} or username ilike ${'%'+q+'%'} or whatsapp ilike ${'%'+q+'%'} order by created_at desc`
      : await db`select id,name,email,whatsapp,username,role,is_blocked,blocked_until,created_at,last_login_at,password_change_allowed from users order by created_at desc limit 5`;
    const total=await db`select count(*)::int as count from users`;
    return NextResponse.json({users:rows,total:Number(total[0]?.count||0)});
  }catch(e:any){
    return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Authentication required'},{status:e.message==='FORBIDDEN'?403:401});
  }
}
