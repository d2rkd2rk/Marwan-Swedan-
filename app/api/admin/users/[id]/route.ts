import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireAdmin} from '@/lib/auth';
import {audit} from '@/lib/security';

export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const admin=await requireAdmin();
  const {id}=await params;
  if(!id)return NextResponse.json({error:'User id is required.'},{status:400});
  const target=await db`select id,name,email,role from users where id=${id} limit 1`;
  if(!target.length)return NextResponse.json({error:'Account not found.'},{status:404});
  if(target[0].role==='admin'){
   const admins=await db`select count(*)::int as count from users where role='admin'`;
   if(Number(admins[0].count)<=1)return NextResponse.json({error:'The last administrator account cannot be deleted.'},{status:400});
  }
  await db`delete from users where id=${id}`;
  await audit(admin.id,'delete_user',request,{deletedUserId:id,deletedEmail:target[0].email});
  return NextResponse.json({ok:true});
 }catch(e:any){return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':e.message==='UNAUTHENTICATED'?'Authentication required':'Could not delete account.'},{status:e.message==='FORBIDDEN'?403:e.message==='UNAUTHENTICATED'?401:400})}
}
