import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import db from '@/lib/db';
import {requireUser,hashPassword,validPassword,verifyPassword} from '@/lib/auth';
import {issueOtp,verifyOtp} from '@/lib/otp';
import {audit} from '@/lib/security';

async function ensureAccountColumns(){
 await db`alter table users add column if not exists username_updated_at timestamptz`;
 await db`alter table users add column if not exists bio text not null default ''`;
 await db`alter table users add column if not exists avatar_url text`;
 await db`alter table users add column if not exists cv_url text`;
 await db`alter table users add column if not exists cv_name text`;
 await db`alter table users add column if not exists password_change_allowed boolean not null default false`;
}
export async function GET(){try{const user=await requireUser();await ensureAccountColumns();const rows=await db`select id,name,email,whatsapp,username,role,is_blocked,blocked_until,bio,avatar_url,cv_url,cv_name,username_updated_at,password_change_allowed from users where id=${user.id} limit 1`;if(!rows.length)return NextResponse.json({error:'Account not found.'},{status:404});return NextResponse.json({user:rows[0]})}catch(e:any){console.error('ACCOUNT_GET_FAILED',e);return NextResponse.json({error:e.message==='UNAUTHENTICATED'?'Authentication required':'Could not load account.'},{status:e.message==='UNAUTHENTICATED'?401:500})}}

export async function PATCH(request:Request){
 try{
  const user=await requireUser();await ensureAccountColumns();
  const currentRows=await db`select name,email,whatsapp,username,username_updated_at,bio,avatar_url,cv_url,cv_name from users where id=${user.id} limit 1`;const current=currentRows[0] as any;if(!current)return NextResponse.json({error:'Account not found.'},{status:404});const body=await request.json();
  const name=String(body.name??current.name).trim();const email=String(body.email??current.email).trim().toLowerCase();const whatsapp=String(body.whatsapp??current.whatsapp).trim();const username=String(body.username??current.username).trim().toLowerCase();const bio=String(body.bio??current.bio??'').trim().slice(0,1000);const avatarUrl=String(body.avatar_url??current.avatar_url??'');const cvUrl=String(body.cv_url??current.cv_url??'');const cvName=String(body.cv_name??current.cv_name??'').slice(0,180);
  if(name.length<2||name.length>80||!/^[A-Za-z0-9_]{3,24}$/.test(username)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||whatsapp.length<7||whatsapp.length>25)return NextResponse.json({error:'Invalid profile data.'},{status:400});
  if(avatarUrl&&!avatarUrl.startsWith('/api/file?pathname=profiles/'))return NextResponse.json({error:'Invalid profile image.'},{status:400});if(cvUrl&&!cvUrl.startsWith('/api/file?pathname=profiles/'))return NextResponse.json({error:'Invalid CV file.'},{status:400});
  const duplicate=await db`select id from users where (lower(username)=${username} or lower(email)=${email}) and id<>${user.id} limit 1`;if(duplicate.length)return NextResponse.json({error:'Email or username is already in use.'},{status:409});
  const usernameChanged=username!==String(current.username).toLowerCase();
  if(usernameChanged&&current.username_updated_at){const nextAllowed=new Date(new Date(current.username_updated_at).getTime()+14*24*60*60*1000);if(nextAllowed>new Date())return NextResponse.json({error:`You can change your username again on ${nextAllowed.toISOString().slice(0,10)}.`},{status:429})}
  const rows=usernameChanged?await db`update users set name=${name},email=${email},whatsapp=${whatsapp},username=${username},username_updated_at=now(),bio=${bio},avatar_url=${avatarUrl},cv_url=${cvUrl},cv_name=${cvName} where id=${user.id} returning id,name,email,whatsapp,username,role,is_blocked,blocked_until,bio,avatar_url,cv_url,cv_name,username_updated_at,password_change_allowed`:await db`update users set name=${name},email=${email},whatsapp=${whatsapp},bio=${bio},avatar_url=${avatarUrl},cv_url=${cvUrl},cv_name=${cvName} where id=${user.id} returning id,name,email,whatsapp,username,role,is_blocked,blocked_until,bio,avatar_url,cv_url,cv_name,username_updated_at,password_change_allowed`;
  await audit(user.id,'profile_update',request,{usernameChanged});return NextResponse.json({user:rows[0]});
 }catch(e:any){console.error('ACCOUNT_PATCH_FAILED',e);return NextResponse.json({error:e.message==='UNAUTHENTICATED'?'Authentication required':'Profile update failed.'},{status:e.message==='UNAUTHENTICATED'?401:400})}
}

export async function POST(request:Request){
 try{
  const user=await requireUser();await ensureAccountColumns();const body=await request.json();
  const next=String(body.newPassword||'');const challengeId=String(body.challengeId||'');const code=String(body.code||'').trim();
  if(!validPassword(next))return NextResponse.json({error:'New password must be 8+ characters with a number and special character.'},{status:400});
  const accountRows=await db`select password_hash,email,password_change_allowed,role from users where id=${user.id} limit 1`;if(!accountRows.length)return NextResponse.json({error:'Account not found.'},{status:404});
  const account=accountRows[0] as any;
  const bootstrap=(await cookies()).get('marwan_admin_bootstrap')?.value==='1';
  if(bootstrap&&user.role==='admin'){
   const passwordHash=await hashPassword(next);await db`update users set password_hash=${passwordHash},password_change_allowed=false where id=${user.id}`;await db`delete from trusted_devices where user_id=${user.id}`;(await cookies()).set('marwan_admin_bootstrap','',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0});await audit(user.id,'admin_initial_password_set',request);return NextResponse.json({ok:true});
  }
  // Admin-granted password change: no current password is displayed or required.
  // The permission is one-time and is automatically consumed after a successful change.
  if(account.password_change_allowed){
   const passwordHash=await hashPassword(next);await db`update users set password_hash=${passwordHash},password_change_allowed=false where id=${user.id} and password_change_allowed=true`;await db`delete from trusted_devices where user_id=${user.id}`;await audit(user.id,'password_change_admin_granted',request);return NextResponse.json({ok:true});
  }
  const currentPassword=String(body.currentPassword||'');
  if(!currentPassword)return NextResponse.json({error:'Password change access is disabled. Ask an administrator to enable it for your account.'},{status:403});
  if(!(await verifyPassword(currentPassword,String(account.password_hash))))return NextResponse.json({error:'Current password is incorrect.'},{status:401});
  if(!challengeId){const id=await issueOtp(user.id,String(account.email),'password_change');return NextResponse.json({requiresOtp:true,challengeId:id})}
  if(!code)return NextResponse.json({error:'Enter the verification code.'},{status:400});
  const verified=await verifyOtp(challengeId,code,'password_change');if(verified!==user.id)return NextResponse.json({error:'Invalid or expired verification code.'},{status:400});
  const passwordHash=await hashPassword(next);await db`update users set password_hash=${passwordHash} where id=${user.id}`;await db`delete from trusted_devices where user_id=${user.id}`;await audit(user.id,'password_change',request);return NextResponse.json({ok:true});
 }catch(e:any){return NextResponse.json({error:e.message==='UNAUTHENTICATED'?'Authentication required':e.message==='EMAIL_NOT_CONFIGURED'?'Email verification is not configured yet.':'Password change failed.'},{status:e.message==='UNAUTHENTICATED'?401:e.message==='EMAIL_NOT_CONFIGURED'?503:400})}
}
