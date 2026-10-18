import db from '@/lib/db';
import {createRandomToken, hashToken} from '@/lib/auth';
import {sendEmail} from '@/lib/email';

export {ensureEmailVerificationSchema} from '@/lib/auth';

export async function sendVerificationEmail(user: {id:string; email:string; name:string}, baseUrl: string) {
  const raw = createRandomToken();
  const tokenHash = hashToken(raw);
  await db`update email_verification_tokens set used_at=now() where user_id=${user.id} and used_at is null`;
  await db`insert into email_verification_tokens(user_id,token_hash,expires_at) values(${user.id},${tokenHash},now()+interval '24 hours')`;
  const url = `${baseUrl.replace(/\/$/, '')}/api/auth/verify-email?token=${raw}`;
  await sendEmail(
    user.email,
    'Verify your Marwan Swedan Academy email',
    `Hi ${user.name},\n\nPlease verify your email address to activate your Marwan Swedan Academy account. This link expires in 24 hours and can only be used once:\n\n${url}\n\nIf you did not create this account, you can ignore this email.\n\nMarwan Swedan Academy`
  );
}

export function siteBaseUrl(origin: string) {
  return (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/$/, '');
}
