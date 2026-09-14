import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {createSession,verifyPassword} from '@/lib/auth';
import {audit,securityEvent} from '@/lib/security';

export async function POST(request:Request){
  try{
    const {identifier,password}=await request.json();
    const value=String(identifier||'').trim().toLowerCase();
    if(!value||!password)return NextResponse.json({error:'Enter your username/email and password.'},{status:400});
    if(!process.env.DATABASE_URL)return NextResponse.json({error:'Database is not configured.'},{status:503});
    const rows=await db`select id,name,email,whatsapp,username,password_hash,role,is_blocked,blocked_until from users where lower(email)=${value} or lower(username)=${value} limit 1`;
    const user=rows[0] as any;
    if(!user)return NextResponse.json({error:'Invalid credentials.'},{status:401});
    if(user.is_blocked&&user.blocked_until&&new Date(user.blocked_until)>new Date())return NextResponse.json({error:'Account is temporarily blocked.'},{status:403});
    const ok=await verifyPassword(String(password),user.password_hash);
    if(!ok){await securityEvent(user.id,'failed_login','medium',request,{identifier:value});return NextResponse.json({error:'Invalid credentials.'},{status:401})}
    await db`update users set last_login_at=now() where id=${user.id}`;
    await createSession(user);
    await audit(user.id,'login',request);
    return NextResponse.json({user:{id:user.id,name:user.name,email:user.email,whatsapp:user.whatsapp,username:user.username,role:user.role}});
  }catch{return NextResponse.json({error:'Login failed.'},{status:500})}
}