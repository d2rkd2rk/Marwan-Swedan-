import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {hashPassword,validPassword} from '@/lib/auth';
import {verifyOtp} from '@/lib/otp';
import {audit} from '@/lib/security';

export async function POST(request:Request){
  try{
    const {challengeId,code,newPassword}=await request.json();
    if(!validPassword(String(newPassword||'')))return NextResponse.json({error:'New password must be 8+ characters with an uppercase letter, a number and a special character.'},{status:400});
    const userId=await verifyOtp(String(challengeId||''),String(code||'').trim(),'password_reset');
    if(!userId)return NextResponse.json({error:'Invalid or expired verification code.'},{status:400});
    const passwordHash=await hashPassword(String(newPassword));
    await db`update users set password_hash=${passwordHash} where id=${userId}`;
    await db`delete from trusted_devices where user_id=${userId}`;
    await audit(userId,'password_reset',request);
    return NextResponse.json({ok:true});
  }catch{return NextResponse.json({error:'Password reset failed.'},{status:500})}
}