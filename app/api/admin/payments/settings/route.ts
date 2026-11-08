import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireAdmin} from '@/lib/auth';
import {ensurePaymentSchema} from '@/lib/payments';
import {audit} from '@/lib/security';
export async function GET(){
 try{await requireAdmin();await ensurePaymentSchema();const rows=await db.unsafe("select instapay_address,account_name,instructions,updated_at from payment_settings where id=1");return NextResponse.json({settings:rows[0]||null})}
 catch(e:any){return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Authentication required'},{status:e.message==='FORBIDDEN'?403:401})}
}
export async function PUT(request:Request){
 try{
  const admin=await requireAdmin();await ensurePaymentSchema();const b=await request.json();
  const address=String(b.instapayAddress||'').trim().slice(0,160),name=String(b.accountName||'').trim().slice(0,120),instructions=String(b.instructions||'').trim().slice(0,1000);
  if(!address||!name)return NextResponse.json({error:'InstaPay address and account holder name are required.'},{status:400});
  await db.unsafe("update payment_settings set instapay_address=$1,account_name=$2,instructions=$3,updated_by=$4,updated_at=now() where id=1",[address,name,instructions||'حوّل المبلغ إلى حساب InstaPay الموضح، ثم ارفع صورة الإيصال وأرسل البيانات للمراجعة.',admin.id]);
  await audit(admin.id,'update_instapay_settings',request,{});
  return NextResponse.json({ok:true});
 }catch(e:any){return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Could not save payment settings.'},{status:e.message==='FORBIDDEN'?403:400})}
}
