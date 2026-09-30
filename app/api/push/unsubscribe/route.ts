import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireUser} from '@/lib/auth';
import {ensurePushTable} from '@/lib/push';
export async function POST(request:Request){
 try{
  const user=await requireUser(); const b=await request.json(); const endpoint=String(b.endpoint||'').trim();
  if(!endpoint)return NextResponse.json({error:'Endpoint is required.'},{status:400});
  await ensurePushTable(); await db`delete from push_subscriptions where user_id=${user.id} and endpoint=${endpoint}`;
  return NextResponse.json({ok:true});
 }catch(e:any){return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Authentication required'},{status:e.message==='FORBIDDEN'?403:401})}
}