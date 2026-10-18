import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {ensureEmailVerificationSchema,sendVerificationEmail,siteBaseUrl} from '@/lib/email-verification';

export async function POST(request:Request){
  try{
    if(!process.env.DATABASE_URL)return NextResponse.json({error:'Database is not configured.'},{status:503});
    const body=await request.json();
    const email=String(body.email||'').trim().toLowerCase();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return NextResponse.json({error:'Enter a valid email address.'},{status:400});
    await ensureEmailVerificationSchema();
    const rows=await db`select id,name,email,email_verified from users where lower(email)=${email} limit 1`;
    const user=rows[0] as any;
    if(user&&!user.email_verified){
      const recent=await db`select id from email_verification_tokens where user_id=${user.id} and created_at>now()-interval '60 seconds' limit 1`;
      if(recent.length)return NextResponse.json({message:'Please wait one minute before requesting another verification email.'},{status:429});
      try{await sendVerificationEmail(user,siteBaseUrl(new URL(request.url).origin))}
      catch(e){console.error('VERIFICATION_RESEND_FAILED',{userId:user.id,message:e instanceof Error?e.message:'unknown'});return NextResponse.json({error:'The verification email could not be sent. Check the email provider settings and try again.'},{status:503})}
    }
    return NextResponse.json({message:'If this account needs verification, a verification email will be sent shortly.'});
  }catch(e){console.error('RESEND_VERIFICATION_FAILED',e);return NextResponse.json({error:'Unable to resend the verification email right now.'},{status:500})}
}
