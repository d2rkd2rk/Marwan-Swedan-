import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireUser} from '@/lib/auth';
import {couponAvailability,couponDiscount,ensureCouponSchema} from '@/lib/coupons';

const defaultWhatsAppNumber='201515227612';

export async function POST(request:Request){
  try{
    const user=await requireUser();await ensureCouponSchema();
    const body=await request.json();const code=String(body.code||'').trim().toUpperCase();const slug=String(body.slug||'');
    if(!code||!slug)return NextResponse.json({error:'Coupon code and course are required.'},{status:400});
    const result=await db.begin(async tx=>{
      const coupons=await tx`select * from discount_coupons where code=${code} for update`;
      const coupon=coupons[0] as any;
      if(!coupon)throw new Error('Invalid coupon code.');
      const courses=await tx`select id,title,price,is_free,published,whatsapp_number from courses where slug=${slug} limit 1`;
      const course=courses[0] as any;
      if(!course||!course.published||course.is_free)throw new Error('This coupon is available only for published paid courses.');
      if(coupon.course_id&&coupon.course_id!==course.id)throw new Error('This coupon is not valid for this course.');
      const used=await tx`select count(*)::int as count from discount_coupon_redemptions where coupon_id=${coupon.id} and user_id=${user.id}`;
      const unavailable=couponAvailability(coupon,Number(used[0]?.count||0));
      if(unavailable)throw new Error(unavailable);
      const totals=couponDiscount(Number(course.price),coupon.discount_type,Number(coupon.discount_value));
      await tx`insert into discount_coupon_redemptions(coupon_id,user_id,course_id,original_price,discount_amount,final_price)
        values(${coupon.id},${user.id},${course.id},${Number(course.price)},${totals.discountAmount},${totals.finalPrice})`;
      await tx`update discount_coupons set usage_count=usage_count+1,updated_at=now() where id=${coupon.id}`;
      const number=String(course.whatsapp_number||defaultWhatsAppNumber).replace(/\D/g,'');
      const message='السلام عليكم، أريد طلب الوصول إلى كورس '+course.title+'.\nالسعر الأصلي: '+Number(course.price)+' EGP\nكود الخصم: '+coupon.code+'\nقيمة الخصم: '+totals.discountAmount+' EGP\nالسعر النهائي: '+totals.finalPrice+' EGP\nUsername/Email: '+(user.username||user.email||'');
      return {whatsappUrl:'https://wa.me/'+number+'?text='+encodeURIComponent(message),...totals,code:coupon.code,originalPrice:Number(course.price)};
    });
    return NextResponse.json({ok:true,...result});
  }catch(e:any){return NextResponse.json({error:e.message==='UNAUTHENTICATED'?'Please sign in to request access.':e.message||'Could not create WhatsApp request.'},{status:e.message==='UNAUTHENTICATED'?401:400})}
}
