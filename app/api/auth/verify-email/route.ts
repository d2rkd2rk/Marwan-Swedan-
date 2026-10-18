import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {adminEmail,hashToken} from '@/lib/auth';
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
      const rows=await tx`select t.id,t.user_id from email_verification_tokens t join users u on u.id=t.user_id where t.token_hash=${tokenHash} and t.used_at is null and t.expires_at>now() and lower(u.email)<>lower(${adminEmail}) and coalesce(u.role,'student') <> 'admin' for update of t`;
      if(!rows.length)return false;
      await tx`update email_verification_tokens set used_at=now() where id=${rows[0].id}`;
      await tx`update users set email_verified=true where id=${rows[0].user_id}`;
      await tx`update email_verification_tokens set used_at=now() where user_id=${rows[0].user_id} and used_at is null`;
      return true;
    });
    return NextResponse.redirect(new URL(result?'/login?verified=success':'/login?verified=invalid',base));
  }catch(e){console.error('EMAIL_VERIFICATION_FAILED',e);return NextResponse.redirect(new URL('/login?verified=error',base))}
}
