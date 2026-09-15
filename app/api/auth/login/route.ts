import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {adminEmail,createSession,trustedDeviceValid,verifyPassword} from '@/lib/auth';
import {issueOtp} from '@/lib/otp';
import {audit,securityEvent} from '@/lib/security';

async function promoteProtectedAdmin(user:any){
  if(String(user.email).toLowerCase()!==String(adminEmail).toLowerCase())return user;
  const admins=await db`select id from users where role='admin' limit 1`;
  if(admins.length)return user;
  const rows=await db`update users set role='admin' where id=${user.id} and role='student' returning id,name,email,whatsapp,username,role`;
  return (rows[0] as any)||user;
}

export async function POST(request:Request){
  try{
    const {identifier,password}=await request.json();
    const value=String(identifier||'').trim().toLowerCase();
    if(!value||!password)return NextResponse.json({error:'Enter your username/email and password.'},{status:400});
    if(!process.env.DATABASE_URL)return NextResponse.json({error:'Database is not configured.'},{status:503});
    const rows=await db`select id,name,email,whatsapp,username,password_hash,role,is_blocked,blocked_until from users where lower(email)=${value} or lower(username)=${value} limit 1`;
    let user=rows[0] as any;
    if(!user)return NextResponse.json({error:'Invalid credentials.'},{status:401});
    if(user.is_blocked&&user.blocked_until&&new Date(user.blocked_until)>new Date())return NextResponse.json({error:'Account is temporarily blocked.'},{status:403});
    const ok=await verifyPassword(String(password),user.password_hash);
    if(!ok){await securityEvent(user.id,'failed_login','medium',request,{identifier:value});return NextResponse.json({error:'Invalid credentials.'},{status:401})}
    if(!(await trustedDeviceValid(user.id))){
      const challengeId=await issueOtp(String(user.id),String(user.email),'login');
      return NextResponse.json({requiresOtp:true,challengeId});
    }
    user=await promoteProtectedAdmin(user);
    await db`update users set last_login_at=now() where id=${user.id}`;
    await createSession(user);
    await audit(user.id,'login',request);
    return NextResponse.json({user:{id:user.id,name:user.name,email:user.email,whatsapp:user.whatsapp,username:user.username,role:user.role}});
  }catch(e:any){
    console.error('LOGIN_FAILED', {name:e?.name, message:e?.message});
    if(e?.message==='EMAIL_NOT_CONFIGURED')return NextResponse.json({error:'Email verification is not configured yet.'},{status:503});
    if(e?.message==='EMAIL_SEND_FAILED')return NextResponse.json({error:'We could not send the verification email. Please try again.'},{status:502});
    return NextResponse.json({error:'Login failed.'},{status:500});
  }
}