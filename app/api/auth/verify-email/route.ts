import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {hashToken} from '@/lib/auth';
import {ensureEmailVerificationSchema} from '@/lib/email-verification';

export async function GET(request:Request){
  const url=new URL(request.url);
  const token=url.searchParams.get('token')||'';
  const base=(process.env.NEXT_PUBLIC_SITE_URL||url.origin).replace(/\/$/,'');
  if(!/^[a-f0-9]{64}$/.test(token))return NextResponse.redirect(new URL('/login?verified=invalid',base));
  try{
    await ensureEmailVerificationSchema();
    const tokenHash=hashToken(token);
    const result=await db.begin(async tx=>{
      const rows=await tx`select id,user_id from email_verification_tokens where token_hash=${tokenHash} and used_at is null and expires_at>now() for update`;
      if(!rows.length)return false;
      await tx`update email_verification_tokens set used_at=now() where id=${rows[0].id}`;
      await tx`update users set email_verified=true where id=${rows[0].user_id}`;
      await tx`update email_verification_tokens set used_at=now() where user_id=${rows[0].user_id} and used_at is null`;
      return true;
    });
    return NextResponse.redirect(new URL(result?'/login?verified=success':'/login?verified=invalid',base));
  }catch(e){console.error('EMAIL_VERIFICATION_FAILED',e);return NextResponse.redirect(new URL('/login?verified=error',base))}
}
