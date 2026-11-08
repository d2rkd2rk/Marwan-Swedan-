import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireAdmin} from '@/lib/auth';
import {ensurePaymentSchema} from '@/lib/payments';
import {sendUserNotification} from '@/lib/push';
export async function GET(request:Request){
 try{
  await requireAdmin();await ensurePaymentSchema();
  const url=new URL(request.url),courseId=url.searchParams.get('courseId')||null,from=url.searchParams.get('from')||null,to=url.searchParams.get('to')||null,status=url.searchParams.get('status')||'all';
  const rows=await db.unsafe("select pr.id,pr.user_id,pr.course_id,pr.coupon_code,pr.original_price,pr.discount_amount,pr.amount,pr.sender_phone,pr.sender_name,pr.transaction_reference,pr.status,pr.decline_reason,pr.created_at,pr.reviewed_at,pr.reviewed_by,u.name as student_name,u.username,u.email,c.title as course_title,c.slug as course_slug from payment_requests pr join users u on u.id=pr.user_id join courses c on c.id=pr.course_id where ($1::uuid is null or pr.course_id=$1::uuid) and ($2::date is null or pr.created_at>=$2::date) and ($3::date is null or pr.created_at<($3::date+interval '1 day')) and ($4='all' or pr.status=$4) order by case when pr.status='pending' then 0 else 1 end,pr.created_at desc limit 1000",[courseId,from,to,status]);
  const summary=await db.unsafe("select count(*) filter(where status='pending')::int as pending,count(*) filter(where status='approved')::int as approved,count(*) filter(where status='declined')::int as declined,coalesce(sum(amount) filter(where status='approved'),0)::numeric(12,2) as revenue from payment_requests where ($1::uuid is null or course_id=$1::uuid) and ($2::date is null or (case when status='approved' then reviewed_at else created_at end)>=$2::date) and ($3::date is null or (case when status='approved' then reviewed_at else created_at end)<($3::date+interval '1 day'))",[courseId,from,to]);
  const monthly=await db.unsafe("select to_char(date_trunc('month',reviewed_at),'YYYY-MM') as month,coalesce(sum(amount),0)::numeric(12,2) as revenue,count(*)::int as approved_count from payment_requests where status='approved' and reviewed_at>=date_trunc('month',now())-interval '11 months' and ($1::uuid is null or course_id=$1::uuid) group by date_trunc('month',reviewed_at) order by date_trunc('month',reviewed_at)",[courseId]);
  return NextResponse.json({requests:rows,summary:summary[0],monthly});
 }catch(e:any){return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Authentication required'},{status:e.message==='FORBIDDEN'?403:401})}
}
export async function PATCH(request:Request){
 try{
  const admin=await requireAdmin();await ensurePaymentSchema();
  const b=await request.json(),id=String(b.id||''),action=String(b.action||''),reason=String(b.reason||'').trim().slice(0,500);
  if(!id||!['approve','decline'].includes(action))return NextResponse.json({error:'Invalid review action.'},{status:400});
  const result=await db.begin(async tx=>{
   const rows=await tx.unsafe("select * from payment_requests where id=$1 for update",[id]);const payment=rows[0] as any;
   if(!payment)throw new Error('Payment request not found.');if(payment.status!=='pending')throw new Error('This payment request has already been reviewed.');
   if(action==='approve'){
    if(payment.coupon_id){
     const coupons=await tx.unsafe("select * from discount_coupons where id=$1 for update",[payment.coupon_id]);const coupon=coupons[0] as any;
     if(!coupon)throw new Error('The coupon attached to this request no longer exists.');
     const used=await tx.unsafe("select count(*)::int as count from discount_coupon_redemptions where coupon_id=$1 and user_id=$2",[coupon.id,payment.user_id]);
     if(coupon.usage_limit!==null&&Number(coupon.usage_count)>=Number(coupon.usage_limit))throw new Error('Coupon usage limit has been reached. Decline this request or resolve it manually.');
     if(Number(used[0]?.count||0)>=Number(coupon.per_user_limit))throw new Error('This student has reached the coupon per-user limit.');
     await tx.unsafe("insert into discount_coupon_redemptions(coupon_id,user_id,course_id,original_price,discount_amount,final_price) values($1,$2,$3,$4,$5,$6)",[coupon.id,payment.user_id,payment.course_id,payment.original_price,payment.discount_amount,payment.amount]);
     await tx.unsafe("update discount_coupons set usage_count=usage_count+1,updated_at=now() where id=$1",[coupon.id]);
    }
    await tx.unsafe("insert into enrollments(user_id,course_id,granted_by,source) values($1,$2,$3,'payment') on conflict(user_id,course_id) do update set granted_by=$3,revoked_at=null,source='payment'",[payment.user_id,payment.course_id,admin.id]);
   }
   const updated=await tx.unsafe("update payment_requests set status=$1,decline_reason=$2,reviewed_by=$3,reviewed_at=now(),updated_at=now() where id=$4 and status='pending' returning user_id,status",[action==='approve'?'approved':'declined',action==='decline'?(reason||'Payment could not be verified.'):null,admin.id,id]);
   if(!updated.length)throw new Error('This payment request has already been reviewed.');
   await tx.unsafe("insert into audit_logs(user_id,action,ip,metadata) values($1,$2,$3,$4::jsonb)",[admin.id,action==='approve'?'approve_payment_request':'decline_payment_request',request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown',JSON.stringify({paymentRequestId:id,studentId:payment.user_id,courseId:payment.course_id,amount:payment.amount,reason})]);
   return updated[0] as any;
  });
  try{await sendUserNotification(result.user_id,action==='approve'?'Payment approved':'Payment request declined',action==='approve'?'Your payment was verified. Course access is now active.':'Your payment request was declined. '+(reason||'Please contact the academy for details.'),'/dashboard/payments','payment-status-'+id)}catch(error){console.error('PAYMENT_STUDENT_PUSH_FAILED',error)}
  return NextResponse.json({ok:true,status:result.status});
 }catch(e:any){return NextResponse.json({error:e.message||'Could not review payment request.'},{status:e.message==='FORBIDDEN'?403:e.message==='UNAUTHENTICATED'?401:400})}
}
