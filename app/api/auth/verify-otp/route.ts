import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {adminEmail,createSession,createTrustedDevice} from '@/lib/auth';
import {verifyOtp} from '@/lib/otp';
import {audit} from '@/lib/security';

async function promoteProtectedAdmin(user:any){
  if(String(user.email).toLowerCase()!==String(adminEmail).toLowerCase())return user;
  const admins=await db`select id from users where role='admin' limit 1`;
  if(admins.length)return user;
  const rows=await db`update users set role='admin' where id=${user.id} and role='student' returning id,name,email,whatsapp,username,role`;
  return (rows[0] as any)||user;
}

export async function POST(request:Request){
  try{
    const {challengeId,code}=await request.json();
    const id=await verifyOtp(String(challengeId||''),String(code||'').trim(),'login');
    if(!id)return NextResponse.json({error:'Invalid or expired verification code.'},{status:400});
    let rows=await db`select id,name,email,whatsapp,username,role from users where id=${id} limit 1`;
    let user=rows[0] as any;
    if(!user)return NextResponse.json({error:'Account not found.'},{status:404});
    user=await promoteProtectedAdmin(user);
    await createTrustedDevice(user.id);
    await createSession(user);
    await db`update users set last_login_at=now() where id=${user.id}`;
    await audit(user.id,'login_otp_verified',request);
    return NextResponse.json({user});
  }catch{return NextResponse.json({error:'Verification failed.'},{status:500})}
}