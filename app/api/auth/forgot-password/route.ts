import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {issueOtp} from '@/lib/otp';

export async function POST(request:Request){
  try{
    const {identifier}=await request.json();
    const value=String(identifier||'').trim().toLowerCase();
    if(!value)return NextResponse.json({error:'Enter your username or email.'},{status:400});
    const rows=await db`select id,email from users where lower(email)=${value} or lower(username)=${value} limit 1`;
    if(!rows.length)return NextResponse.json({ok:true});
    const challengeId=await issueOtp(String(rows[0].id),String(rows[0].email),'password_reset');
    return NextResponse.json({challengeId});
  }catch(e:any){return NextResponse.json({error:e.message==='EMAIL_NOT_CONFIGURED'?'Email verification is not configured yet.':'Unable to send verification code.'},{status:e.message==='EMAIL_NOT_CONFIGURED'?503:500})}
}