import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireAdmin} from '@/lib/auth';
import {audit} from '@/lib/security';

async function setAccess(request:Request,params:{id:string},allowed:boolean){
 try{
  const admin=await requireAdmin();
  const {id}=params;
  if(!id)return NextResponse.json({error:'User id is required.'},{status:400});
  const rows=await db`update users set password_change_allowed=${allowed} where id=${id} returning id,name,email,password_change_allowed`;
  if(!rows.length)return NextResponse.json({error:'Account not found.'},{status:404});
  await audit(admin.id,allowed?'grant_password_change':'revoke_password_change',request,{targetUserId:id});
  return NextResponse.json({ok:true,user:rows[0]});
 }catch(e:any){return NextResponse.json({error:e.message==='UNAUTHENTICATED'?'Authentication required':e.message==='FORBIDDEN'?'Forbidden':'Could not update password access.'},{status:e.message==='UNAUTHENTICATED'?401:e.message==='FORBIDDEN'?403:500})}
}

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){return setAccess(request,await params,true)}
export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}){return setAccess(request,await params,false)}
