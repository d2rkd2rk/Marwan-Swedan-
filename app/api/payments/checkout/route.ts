import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireUser} from '@/lib/auth';
import {ensurePaymentSchema} from '@/lib/payments';
import {ensurePathTables,hasCourseAccess,hasPathAccess} from '@/lib/pathAccess';
import {couponAvailability,couponDiscount} from '@/lib/coupons';
export async function GET(request:Request){
 try{
  const user=await requireUser();await ensurePaymentSchema();await ensurePathTables();
  const url=new URL(request.url),slug=url.searchParams.get('slug')||'',targetType=url.searchParams.get('type')==='path'?'path':'course';
  const targetRows=targetType==='path'
   ?await db.unsafe("select id,title,slug,price,is_free,published from paths where slug=$1 limit 1",[slug])
   :await db.unsafe("select id,title,slug,price,is_free,published from courses where slug=$1 limit 1",[slug]);
  const target=targetRows[0] as any;
  if(!target||!target.published||target.is_free)return NextResponse.json({error:targetType==='path'?'Paid path not found.':'Paid course not found.'},{status:404});
  const hasAccess=targetType==='path'?await hasPathAccess(user.id,target.id):await hasCourseAccess(user.id,target.id);
  if(hasAccess)return NextResponse.json({error:'You already have access to this '+targetType+'.'},{status:409});
  const settings=await db.unsafe("select instapay_address,account_name,instructions from payment_settings where id=1");
  const code=(url.searchParams.get('coupon')||'').trim().toUpperCase();
  let coupon:any=null,discountAmount=0,finalPrice=Number(target.price);
  if(code){
   const found=await db.unsafe("select * from discount_coupons where code=$1 limit 1",[code]);coupon=found[0] as any;
   if(!coupon)return NextResponse.json({error:'Invalid coupon code.'},{status:400});
   if(targetType==='path'&&coupon.course_id)return NextResponse.json({error:'This coupon is restricted to a specific course and cannot be used for a path.'},{status:400});
   if(targetType==='course'&&coupon.course_id&&coupon.course_id!==target.id)return NextResponse.json({error:'This coupon is not valid for this course.'},{status:400});
   const used=await db.unsafe("select count(*)::int as count from discount_coupon_redemptions where coupon_id=$1 and user_id=$2",[coupon.id,user.id]);
   const unavailable=couponAvailability(coupon,Number(used[0]?.count||0));if(unavailable)return NextResponse.json({error:unavailable},{status:400});
   const totals=couponDiscount(Number(target.price),coupon.discount_type,Number(coupon.discount_value));discountAmount=totals.discountAmount;finalPrice=totals.finalPrice;
  }
  const pending=targetType==='path'
   ?await db.unsafe("select id,status from payment_requests where user_id=$1 and path_id=$2 and status='pending' limit 1",[user.id,target.id])
   :await db.unsafe("select id,status from payment_requests where user_id=$1 and course_id=$2 and status='pending' limit 1",[user.id,target.id]);
  return NextResponse.json({targetType,target,settings:settings[0]||null,coupon:coupon?{code:coupon.code}:null,originalPrice:Number(target.price),discountAmount,finalPrice,pending:pending[0]||null});
 }catch(e:any){return NextResponse.json({error:e.message==='UNAUTHENTICATED'?'Please sign in first.':'Could not load payment details.'},{status:e.message==='UNAUTHENTICATED'?401:500})}
}
