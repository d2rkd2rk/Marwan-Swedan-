import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireUser} from '@/lib/auth';
import {ensurePaymentSchema,safeReceiptKey} from '@/lib/payments';
import {ensurePathTables} from '@/lib/pathAccess';
import {couponAvailability,couponDiscount} from '@/lib/coupons';
import {sendRoleNotification} from '@/lib/push';
export async function GET(){
 try{
  const user=await requireUser();await ensurePaymentSchema();
  if(user.role==='admin')return NextResponse.json({error:'Student payment history is not available for admins.'},{status:403});
  const requests=await db.unsafe("select pr.id,pr.original_price,pr.discount_amount,pr.amount,pr.coupon_code,pr.status,pr.decline_reason,pr.created_at,pr.reviewed_at,c.title as course_title,c.slug as course_slug from payment_requests pr join courses c on c.id=pr.course_id where pr.user_id=$1 order by pr.created_at desc",[user.id]);
  return NextResponse.json({requests});
 }catch(e:any){return NextResponse.json({error:e.message==='UNAUTHENTICATED'?'Authentication required':'Could not load payment requests.'},{status:e.message==='UNAUTHENTICATED'?401:500})}
}
export async function POST(request:Request){
 try{
  const user=await requireUser();await ensurePaymentSchema();
  if(user.role==='admin')return NextResponse.json({error:'Admins cannot submit student payment requests.'},{status:403});
  const b=await request.json(),slug=String(b.slug||'').trim(),senderPhone=String(b.senderPhone||'').replace(/\D/g,'').slice(0,20),senderName=String(b.senderName||'').trim().slice(0,120),reference=String(b.transactionReference||'').trim().slice(0,120),receiptKey=String(b.receiptKey||'');
  if(!slug||senderPhone.length<8||senderName.length<2||!safeReceiptKey(receiptKey,user.id))return NextResponse.json({error:'Complete the sender details and upload a valid receipt.'},{status:400});
  await ensurePathTables();
  const result=await db.begin(async tx=>{
   const courses=await tx.unsafe("select id,title,price,is_free,published from courses where slug=$1 for update",[slug]);const course=courses[0] as any;
   if(!course||!course.published||course.is_free)throw new Error('This paid course is unavailable.');
   const access=await tx.unsafe("select id from enrollments where user_id=$1 and course_id=$2 and revoked_at is null limit 1",[user.id,course.id]);if(access.length)throw new Error('You already have access to this course.');
   const pending=await tx.unsafe("select id from payment_requests where user_id=$1 and course_id=$2 and status='pending' limit 1",[user.id,course.id]);if(pending.length)throw new Error('You already have a pending request for this course.');
   let couponId:any=null,couponCode:any=null,discount=0,amount=Number(course.price);
   const code=String(b.couponCode||'').trim().toUpperCase();
   if(code){
    const coupons=await tx.unsafe("select * from discount_coupons where code=$1 for update",[code]);const coupon=coupons[0] as any;
    if(!coupon)throw new Error('Invalid coupon code.');if(coupon.course_id&&coupon.course_id!==course.id)throw new Error('This coupon is not valid for this course.');
    const used=await tx.unsafe("select count(*)::int as count from discount_coupon_redemptions where coupon_id=$1 and user_id=$2",[coupon.id,user.id]);
    const unavailable=couponAvailability(coupon,Number(used[0]?.count||0));if(unavailable)throw new Error(unavailable);
    const totals=couponDiscount(Number(course.price),coupon.discount_type,Number(coupon.discount_value));couponId=coupon.id;couponCode=coupon.code;discount=totals.discountAmount;amount=totals.finalPrice;
   }
   const inserted=await tx.unsafe("insert into payment_requests(user_id,course_id,coupon_id,coupon_code,original_price,discount_amount,amount,sender_phone,sender_name,transaction_reference,receipt_key) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning id",[user.id,course.id,couponId,couponCode,Number(course.price),discount,amount,senderPhone,senderName,reference||null,receiptKey]);
   return {id:inserted[0].id,title:course.title};
  });
  try{await sendRoleNotification('admin','New InstaPay payment request',user.name+' submitted a payment request for '+result.title+'.','/admin/transactions','payment-'+result.id)}catch(error){console.error('PAYMENT_ADMIN_PUSH_FAILED',error)}
  return NextResponse.json({ok:true,id:result.id,message:'Your payment request has been submitted and is awaiting admin review.'},{status:201});
 }catch(e:any){const duplicate=String(e.message||'').includes('payment_requests_one_pending_idx')||String(e.message||'').includes('duplicate key');return NextResponse.json({error:duplicate?'You already have a pending request for this course.':e.message||'Could not submit payment request.'},{status:e.message==='UNAUTHENTICATED'?401:e.message==='FORBIDDEN'?403:400})}
}
