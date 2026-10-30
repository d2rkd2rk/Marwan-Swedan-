import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireAdmin} from '@/lib/auth';
import {audit} from '@/lib/security';
import {ensurePathTables} from '@/lib/pathAccess';

export async function GET(request:Request){
 try{
  await requireAdmin(); await ensurePathTables();
  const q=(new URL(request.url).searchParams.get('q')||'').trim();
  const rows=q
   ? await db`select pe.id,pe.user_id,pe.path_id,pe.created_at,u.name,u.email,u.username,u.whatsapp,p.title as path_title
      from path_enrollments pe join users u on u.id=pe.user_id join paths p on p.id=pe.path_id
      where pe.revoked_at is null and (u.name ilike ${'%'+q+'%'} or u.username ilike ${'%'+q+'%'} or u.whatsapp ilike ${'%'+q+'%'} or u.email ilike ${'%'+q+'%'})
      order by pe.created_at desc`
   : await db`select pe.id,pe.user_id,pe.path_id,pe.created_at,u.name,u.email,u.username,u.whatsapp,p.title as path_title
      from path_enrollments pe join users u on u.id=pe.user_id join paths p on p.id=pe.path_id
      where pe.revoked_at is null order by pe.created_at desc limit 5`;
  const total=await db`select count(*)::int as count from path_enrollments where revoked_at is null`;
  return NextResponse.json({enrollments:rows,total:Number(total[0]?.count||0)});
 }catch(e:any){return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Authentication required'},{status:e.message==='FORBIDDEN'?403:401})}
}
export async function POST(request:Request){
 try{
  const admin=await requireAdmin(); await ensurePathTables();
  const b=await request.json(); const pathId=String(b.pathId||'');
  const rawIds=Array.isArray(b.userIds)?b.userIds:[b.userId];
  const userIds:string[]=Array.from(new Set<string>((rawIds as unknown[]).filter((id):id is string=>typeof id==='string'&&id.trim().length>0).map(id=>id.trim())));
  if(!userIds.length||!pathId)return NextResponse.json({error:'At least one account and a path are required.'},{status:400});
  if(userIds.length>500)return NextResponse.json({error:'Select no more than 500 accounts at once.'},{status:400});
  const rows=await db`insert into path_enrollments(user_id,path_id,granted_by,source) select selected.user_id,${pathId},${admin.id},'admin' from unnest(${userIds}::uuid[]) as selected(user_id) on conflict(user_id,path_id) do update set granted_by=${admin.id},revoked_at=null,source='admin' returning user_id`;
  await audit(admin.id,'grant_path_access',request,{pathId,userIds,granted:Number(rows.length)});
  return NextResponse.json({ok:true,granted:rows.length});
 }catch(e:any){return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Could not grant path access'},{status:e.message==='FORBIDDEN'?403:400})}
}
export async function DELETE(request:Request){
 try{
  const admin=await requireAdmin(); await ensurePathTables();
  const b=await request.json(); const userId=String(b.userId||''),pathId=String(b.pathId||'');
  if(!userId||!pathId)return NextResponse.json({error:'userId and pathId are required.'},{status:400});
  await db`update path_enrollments set revoked_at=now() where user_id=${userId} and path_id=${pathId}`;
  await audit(admin.id,'revoke_path_access',request,{userId,pathId});
  return NextResponse.json({ok:true});
 }catch(e:any){return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Could not revoke path access'},{status:e.message==='FORBIDDEN'?403:400})}
}
