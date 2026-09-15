import {randomInt} from 'crypto';
import db from './db';
import {hashToken} from './auth';
import {sendEmail} from './email';

export async function issueOtp(userId:string,email:string,purpose:'login'|'password_reset'|'password_change'|'email_change'){
  await db`update otp_challenges set consumed_at=now() where user_id=${userId} and purpose=${purpose} and consumed_at is null`;
  const code=String(randomInt(100000,1000000));
  const codeHash=hashToken(code);
  const rows=await db`insert into otp_challenges(user_id,purpose,code_hash,expires_at) values(${userId},${purpose},${codeHash},now()+interval '10 minutes') returning id`;
  try{
    await sendEmail(email,'Your Marwan Swedan verification code',`Your verification code is ${code}. It expires in 10 minutes. If you did not request this code, ignore this email.`);
  }catch(error){await db`delete from otp_challenges where id=${rows[0].id}`;throw error}
  return String(rows[0].id);
}

export async function verifyOtp(challengeId:string,code:string,purpose:string){
  const rows=await db`select id,user_id,code_hash,attempts,expires_at,consumed_at from otp_challenges where id=${challengeId} and purpose=${purpose} limit 1`;
  const challenge=rows[0] as any;
  if(!challenge||challenge.consumed_at||new Date(challenge.expires_at)<=new Date()||challenge.attempts>=5)return null;
  const valid=hashToken(code)===challenge.code_hash;
  if(!valid){await db`update otp_challenges set attempts=attempts+1 where id=${challenge.id}`;return null}
  const consumed=await db`update otp_challenges set consumed_at=now() where id=${challenge.id} and consumed_at is null returning user_id`;
  return consumed.length?String(consumed[0].user_id):null;
}