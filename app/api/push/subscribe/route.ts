import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireUser} from '@/lib/auth';
import {ensurePushTable} from '@/lib/push';
export async function POST(request:Request){
 try{
  const user=await requireUser();
  const b=await request.json();
  const endpoint=String(b.endpoint||'').trim(),p256dh=String(b.keys?.p256dh||''),auth=String(b.keys?.auth||'');
  if(!endpoint||!p256dh||!auth)return NextResponse.json({error:'Invalid push subscription.'},{status:400});
  await ensurePushTable();
  await db`insert into push_subscriptions(user_id,endpoint,p256dh,auth,last_used_at) values(${user.id},${endpoint},${p256dh},${auth},now()) on conflict(endpoint) do update set user_id=excluded.user_id,p256dh=excluded.p256dh,auth=excluded.auth,last_used_at=now()`;
  return NextResponse.json({ok:true});
 }catch(e:any){return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Authentication required'},{status:e.message==='FORBIDDEN'?403:401})}
}