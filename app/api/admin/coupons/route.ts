import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireAdmin} from '@/lib/auth';
import {audit} from '@/lib/security';
import {ensureCouponSchema} from '@/lib/coupons';

function parseCoupon(body:any){
  const code=String(body.code||'').trim().toUpperCase();
  const type=body.discountType==='fixed'?'fixed':'percentage';
  const value=Number(body.discountValue);
  const startsAt=new Date(body.startsAt);
  const expiresAt=new Date(body.expiresAt);
  const usageLimit=body.usageLimit===''||body.usageLimit===null||body.usageLimit===undefined?null:Number(body.usageLimit);
  const perUserLimit=Math.floor(Number(body.perUserLimit||1));
  if(!/^[A-Z0-9_-]{3,40}$/.test(code))throw new Error('Coupon code must contain 3–40 letters, numbers, hyphens or underscores.');
  if(!Number.isFinite(value)||value<=0||(type==='percentage'&&value>100))throw new Error(type==='percentage'?'Percentage must be between 1 and 100.':'Fixed discount must be greater than zero.');
  if(!Number.isFinite(startsAt.getTime())||!Number.isFinite(expiresAt.getTime())||expiresAt<=startsAt)throw new Error('Choose a valid start and expiry date/time.');
  if(usageLimit!==null&&(!Number.isInteger(usageLimit)||usageLimit<1))throw new Error('Usage limit must be a positive whole number or left empty.');
  if(!Number.isInteger(perUserLimit)||perUserLimit<1||perUserLimit>100)throw new Error('Per-user limit must be between 1 and 100.');
  const courseId=body.courseId||null,pathId=body.pathId||null;
  if(courseId&&pathId)throw new Error('A coupon can target either a course or a path, not both.');
  return {code,type,value,startsAt:startsAt.toISOString(),expiresAt:expiresAt.toISOString(),usageLimit,perUserLimit,courseId,pathId,isActive:body.isActive!==false};
}

export async function GET(){
  try{
    await requireAdmin();await ensureCouponSchema();
    const coupons=await db`select dc.*,c.title as course_title,p.title as path_title from discount_coupons dc left join courses c on c.id=dc.course_id left join paths p on p.id=dc.path_id order by dc.created_at desc`;
    const redemptions=await db`select r.id,r.coupon_id,r.user_id,r.course_id,r.path_id,r.original_price,r.discount_amount,r.final_price,r.created_at,u.name,u.username,u.email,coalesce(c.title,p.title) as course_title,case when r.path_id is null then 'course' else 'path' end as target_type,dc.code from discount_coupon_redemptions r join users u on u.id=r.user_id left join courses c on c.id=r.course_id left join paths p on p.id=r.path_id join discount_coupons dc on dc.id=r.coupon_id order by r.created_at desc limit 200`;
    return NextResponse.json({coupons,redemptions});
  }catch(e:any){return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Authentication required'},{status:e.message==='FORBIDDEN'?403:401})}
}

export async function POST(request:Request){
  try{
    const admin=await requireAdmin();await ensureCouponSchema();
    const b=parseCoupon(await request.json());
    if(b.courseId){const target=await db`select id from courses where id=${b.courseId} limit 1`;if(!target.length)throw new Error('Selected course was not found.');}
    if(b.pathId){const target=await db`select id from paths where id=${b.pathId} limit 1`;if(!target.length)throw new Error('Selected path was not found.');}
    const rows=await db`insert into discount_coupons(code,discount_type,discount_value,course_id,path_id,starts_at,expires_at,usage_limit,per_user_limit,is_active,created_by)
      values(${b.code},${b.type},${b.value},${b.courseId},${b.pathId},${b.startsAt},${b.expiresAt},${b.usageLimit},${b.perUserLimit},${b.isActive},${admin.id}) returning id`;
    await audit(admin.id,'create_discount_coupon',request,{couponId:rows[0].id,code:b.code});
    return NextResponse.json({ok:true,id:rows[0].id},{status:201});
  }catch(e:any){return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':e.message?.includes('duplicate key')?'A coupon with this code already exists.':e.message||'Could not create coupon.'},{status:e.message==='FORBIDDEN'?403:400})}
}

export async function PUT(request:Request){
  try{
    const admin=await requireAdmin();await ensureCouponSchema();
    const body=await request.json();const id=String(body.id||'');if(!id)return NextResponse.json({error:'Coupon ID is required.'},{status:400});
    if(body.action==='toggle'){
      const rows=await db`update discount_coupons set is_active=not is_active,updated_at=now() where id=${id} returning code,is_active`;
      if(!rows.length)return NextResponse.json({error:'Coupon not found.'},{status:404});
      await audit(admin.id,'toggle_discount_coupon',request,{couponId:id,active:rows[0].is_active});
      return NextResponse.json({ok:true,active:rows[0].is_active});
    }
    const b=parseCoupon(body);
    if(b.courseId){const target=await db`select id from courses where id=${b.courseId} limit 1`;if(!target.length)throw new Error('Selected course was not found.');}
    if(b.pathId){const target=await db`select id from paths where id=${b.pathId} limit 1`;if(!target.length)throw new Error('Selected path was not found.');}
    const rows=await db`update discount_coupons set code=${b.code},discount_type=${b.type},discount_value=${b.value},course_id=${b.courseId},path_id=${b.pathId},starts_at=${b.startsAt},expires_at=${b.expiresAt},usage_limit=${b.usageLimit},per_user_limit=${b.perUserLimit},is_active=${b.isActive},updated_at=now() where id=${id} returning id`;
    if(!rows.length)return NextResponse.json({error:'Coupon not found.'},{status:404});
    await audit(admin.id,'update_discount_coupon',request,{couponId:id,code:b.code});
    return NextResponse.json({ok:true});
  }catch(e:any){return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':e.message?.includes('duplicate key')?'A coupon with this code already exists.':e.message||'Could not update coupon.'},{status:e.message==='FORBIDDEN'?403:400})}
}
