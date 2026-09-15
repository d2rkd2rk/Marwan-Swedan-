import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import db from '@/lib/db';
import {createSession,hashToken} from '@/lib/auth';
import {audit} from '@/lib/security';

export async function GET(request:Request){
  try{
    const token=new URL(request.url).searchParams.get('token')||'';
    if(!token)return NextResponse.redirect(new URL('/login?error=invalid-link',request.url));
    const rows=await db`update admin_login_links set used_at=now() where token_hash=${hashToken(token)} and used_at is null and expires_at>now() returning user_id`;
    if(!rows.length)return NextResponse.redirect(new URL('/login?error=expired-link',request.url));
    const users=await db`select id,name,email,whatsapp,username,role from users where id=${rows[0].user_id} and role='admin' limit 1`;
    if(!users.length)return NextResponse.redirect(new URL('/login?error=invalid-link',request.url));
    const user=users[0] as any;
    await createSession(user);
    (await cookies()).set('marwan_admin_bootstrap','1',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*15});
    await audit(user.id,'admin_one_time_login',request);
    return NextResponse.redirect(new URL('/account?bootstrap=1',request.url));
  }catch{return NextResponse.redirect(new URL('/login?error=login-link-failed',request.url))}
}