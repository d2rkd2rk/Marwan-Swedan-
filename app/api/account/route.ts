import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireUser,hashPassword,validPassword,verifyPassword} from '@/lib/auth';
import {audit} from '@/lib/security';

export async function GET(){
  try{const user=await requireUser();const rows=await db`select id,name,email,whatsapp,username,role,is_blocked,blocked_until,bio,avatar_url,cv_url,cv_name from users where id=${user.id} limit 1`;return NextResponse.json({user:rows[0]})}catch{return NextResponse.json({error:'Authentication required'},{status:401})}
}

export async function PATCH(request:Request){
  try{
    const user=await requireUser();
    const currentRows=await db`select name,username,bio,avatar_url,cv_url,cv_name from users where id=${user.id} limit 1`;
    const current=currentRows[0] as any;
    const body=await request.json();
    const name=String(body.name??current.name).trim();
    const username=String(body.username??current.username).trim().toLowerCase();
    const bio=String(body.bio??current.bio??'').trim().slice(0,1000);
    const avatarUrl=String(body.avatar_url??current.avatar_url??'');
    const cvUrl=String(body.cv_url??current.cv_url??'');
    const cvName=String(body.cv_name??current.cv_name??'').slice(0,180);
    if(name.length<2||name.length>80||!/^[A-Za-z0-9_]{3,24}$/.test(username))return NextResponse.json({error:'Invalid profile data.'},{status:400});
    if(avatarUrl&&!avatarUrl.startsWith('/api/file?pathname=profiles/'))return NextResponse.json({error:'Invalid profile image.'},{status:400});
    if(cvUrl&&!cvUrl.startsWith('/api/file?pathname=profiles/'))return NextResponse.json({error:'Invalid CV file.'},{status:400});
    const duplicate=await db`select id from users where lower(username)=${username} and id<>${user.id} limit 1`;
    if(duplicate.length)return NextResponse.json({error:'Username is already in use.'},{status:409});
    const rows=await db`update users set name=${name},username=${username},bio=${bio},avatar_url=${avatarUrl},cv_url=${cvUrl},cv_name=${cvName} where id=${user.id} returning id,name,email,whatsapp,username,role,is_blocked,blocked_until,bio,avatar_url,cv_url,cv_name`;
    await audit(user.id,'profile_update',request);
    return NextResponse.json({user:rows[0]});
  }catch(e:any){return NextResponse.json({error:e.message==='UNAUTHENTICATED'?'Authentication required':'Profile update failed.'},{status:e.message==='UNAUTHENTICATED'?401:400})}
}

export async function POST(request:Request){
  try{
    const user=await requireUser();
    const body=await request.json();
    const currentPassword=String(body.currentPassword||'');
    const next=String(body.newPassword||'');
    if(!currentPassword||!validPassword(next))return NextResponse.json({error:'New password must be 8+ characters with a number and special character.'},{status:400});
    const rows=await db`select password_hash from users where id=${user.id} limit 1`;
    if(!rows.length)return NextResponse.json({error:'Account not found.'},{status:404});
    if(!(await verifyPassword(currentPassword,String(rows[0].password_hash))))return NextResponse.json({error:'Current password is incorrect.'},{status:401});
    const passwordHash=await hashPassword(next);
    await db`update users set password_hash=${passwordHash} where id=${user.id}`;
    await audit(user.id,'password_change',request);
    return NextResponse.json({ok:true});
  }catch(e:any){return NextResponse.json({error:e.message==='UNAUTHENTICATED'?'Authentication required':'Password change failed.'},{status:e.message==='UNAUTHENTICATED'?401:400})}
}
