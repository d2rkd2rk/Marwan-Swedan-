import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireUser} from '@/lib/auth';
import {couponAvailability,couponDiscount,ensureCouponSchema} from '@/lib/coupons';

export async function POST(request:Request){
  try{
    const user=await requireUser();await ensureCouponSchema();
    const body=await request.json();const code=String(body.code||'').trim().toUpperCase();const slug=String(body.slug||'');
    if(!code||!slug)return NextResponse.json({error:'Enter a coupon code.'},{status:400});
    const courses=await db`select id,title,price,is_free,published from courses where slug=${slug} limit 1`;
    const course=courses[0] as any;
    if(!course||!course.published||course.is_free)return NextResponse.json({error:'Coupon codes are available only for published paid courses.'},{status:404});
    const rows=await db`select * from discount_coupons where code=${code} limit 1`;
    const coupon=rows[0] as any;
    if(!coupon)return NextResponse.json({error:'Invalid coupon code.'},{status:404});
    if(coupon.course_id&&coupon.course_id!==course.id)return NextResponse.json({error:'This coupon is not valid for this course.'},{status:400});
    const used=await db`select count(*)::int as count from discount_coupon_redemptions where coupon_id=${coupon.id} and user_id=${user.id}`;
    const unavailable=couponAvailability(coupon,Number(used[0]?.count||0));
    if(unavailable)return NextResponse.json({error:unavailable},{status:400});
    const totals=couponDiscount(Number(course.price),coupon.discount_type,Number(coupon.discount_value));
    return NextResponse.json({ok:true,code:coupon.code,discountType:coupon.discount_type,discountValue:Number(coupon.discount_value),...totals,originalPrice:Number(course.price)});
  }catch(e:any){return NextResponse.json({error:e.message==='UNAUTHENTICATED'?'Please sign in to use a coupon.':'Could not validate coupon.'},{status:e.message==='UNAUTHENTICATED'?401:400})}
}
