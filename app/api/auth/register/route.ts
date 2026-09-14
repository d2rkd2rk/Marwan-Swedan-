import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {adminEmail,createSession,hashPassword,validPassword} from '@/lib/auth';
import {audit,clientIp} from '@/lib/security';
import {sendWhatsAppText} from '@/lib/whatsapp';

export async function POST(request:Request){
  try{
    const body=await request.json();
    const name=String(body.name||'').trim();
    const email=String(body.email||'').trim().toLowerCase();
    const whatsapp=String(body.whatsapp||'').replace(/\D/g,'');
    const username=String(body.username||'').trim().toLowerCase();
    const password=String(body.password||'');
    if(name.length<2||name.length>80||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||whatsapp.length<10||!/^\w{3,24}$/.test(username)||!validPassword(password))return NextResponse.json({error:'Invalid registration data.'},{status:400});
    if(email===adminEmail)return NextResponse.json({error:'The administrator account uses a protected setup flow.'},{status:403});
    if(!process.env.DATABASE_URL)return NextResponse.json({error:'Database is not configured.'},{status:503});
    const existing=await db`select id from users where lower(email)=${email} or lower(username)=${username} limit 1`;
    if(existing.length)return NextResponse.json({error:'Email or username is already in use.'},{status:409});
    const passwordHash=await hashPassword(password);
    const rows=await db`insert into users(name,email,whatsapp,username,password_hash) values(${name},${email},${whatsapp},${username},${passwordHash}) returning id,name,email,whatsapp,username,role`;
    const user=rows[0] as any;
    await createSession(user);
    await audit(user.id,'register',request,{ip:clientIp(request)});
    const message=`Marwan Swedan Academy: registration completed successfully for @${username}. You can now sign in and access courses assigned to your account.`;
    await sendWhatsAppText(whatsapp,message);
    return NextResponse.json({user});
  }catch{return NextResponse.json({error:'Registration failed.'},{status:500})}
}