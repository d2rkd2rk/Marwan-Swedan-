import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {hashPassword,validPassword} from '@/lib/auth';
import {audit,clientIp} from '@/lib/security';
import {ensureEmailVerificationSchema,sendVerificationEmail,siteBaseUrl} from '@/lib/email-verification';

export async function POST(request:Request){
  try{
    const body=await request.json();
    const name=String(body.name||'').trim();
    const email=String(body.email||'').trim().toLowerCase();
    const whatsapp=String(body.whatsapp||'').replace(/\D/g,'');
    const username=String(body.username||'').trim().toLowerCase();
    const password=String(body.password||'');
    if(name.length<2||name.length>80||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||whatsapp.length<10||!/^[A-Za-z0-9_]{3,24}$/.test(username)||!validPassword(password))return NextResponse.json({error:'Invalid registration data.'},{status:400});
    if(!process.env.DATABASE_URL)return NextResponse.json({error:'Database is not configured.'},{status:503});
    await ensureEmailVerificationSchema();
    const existing=await db`select id from users where lower(email)=${email} or lower(username)=${username} limit 1`;
    if(existing.length)return NextResponse.json({error:'Email or username is already in use.'},{status:409});
    const passwordHash=await hashPassword(password);
    const rows=await db`insert into users(name,email,whatsapp,username,password_hash,email_verified) values(${name},${email},${whatsapp},${username},${passwordHash},false) returning id,name,email,whatsapp,username,role`;
    const user=rows[0] as any;
    await audit(user.id,'register',request,{ip:clientIp(request)});
    let emailSent=true;
    try{await sendVerificationEmail(user,siteBaseUrl(new URL(request.url).origin))}
    catch(e){emailSent=false;console.error('VERIFICATION_EMAIL_FAILED',{userId:user.id,message:e instanceof Error?e.message:'unknown'})}
    return NextResponse.json({registered:true,email,emailSent});
  }catch(e:any){
    console.error('REGISTRATION_FAILED',{message:e?.message});
    if(e?.code==='23505')return NextResponse.json({error:'Email or username is already in use.'},{status:409});
    return NextResponse.json({error:'Registration failed. Please try again.'},{status:500});
  }
}
