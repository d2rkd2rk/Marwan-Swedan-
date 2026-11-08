import db from '@/lib/db';
let schemaPromise:Promise<void>|null=null;
export function ensureCouponSchema(){
  if(!schemaPromise){
    schemaPromise=(async()=>{
      await db\`create table if not exists discount_coupons(
        id uuid primary key default gen_random_uuid(),
        code text not null unique,
        discount_type text not null check(discount_type in ('percentage','fixed')),
        discount_value numeric(12,2) not null check(discount_value>0),
        course_id uuid references courses(id) on delete cascade,
        starts_at timestamptz not null,
        expires_at timestamptz not null,
        usage_limit integer,
        per_user_limit integer not null default 1,
        usage_count integer not null default 0,
        is_active boolean not null default true,
        created_by uuid references users(id) on delete set null,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        check(expires_at>starts_at),
        check(usage_limit is null or usage_limit>0),
        check(per_user_limit>0)
      )\`;
      await db\`create index if not exists discount_coupons_active_idx on discount_coupons(is_active,starts_at,expires_at)\`;
      await db\`create table if not exists discount_coupon_redemptions(
        id uuid primary key default gen_random_uuid(),
        coupon_id uuid not null references discount_coupons(id) on delete cascade,
        user_id uuid not null references users(id) on delete cascade,
        course_id uuid references courses(id) on delete cascade,
        path_id uuid references paths(id) on delete cascade,
        original_price numeric(12,2) not null,
        discount_amount numeric(12,2) not null,
        final_price numeric(12,2) not null,
        created_at timestamptz not null default now(),
        check((course_id is not null)::int+(path_id is not null)::int=1)
      )\`;
      await db\`alter table discount_coupon_redemptions alter column course_id drop not null\`;
      await db\`alter table discount_coupon_redemptions add column if not exists path_id uuid references paths(id) on delete cascade\`;
      await db.unsafe("do $$ begin if not exists(select 1 from pg_constraint where conname='discount_coupon_redemptions_one_target_check') then alter table discount_coupon_redemptions add constraint discount_coupon_redemptions_one_target_check check((course_id is not null)::int+(path_id is not null)::int=1); end if; end $$");
      await db\`create index if not exists discount_coupon_redemptions_coupon_idx on discount_coupon_redemptions(coupon_id,created_at desc)\`;
      await db\`create index if not exists discount_coupon_redemptions_user_idx on discount_coupon_redemptions(coupon_id,user_id)\`;
    })().catch(error=>{schemaPromise=null;throw error});
  }
  return schemaPromise;
}
export function couponDiscount(price:number,type:string,value:number){
  const discount=type==='percentage'?price*Math.min(100,value)/100:Math.min(price,value);
  return {discountAmount:Math.round(discount*100)/100,finalPrice:Math.max(0,Math.round((price-discount)*100)/100)};
}
export function couponAvailability(coupon:any,userUsage:number){
  const now=Date.now();
  if(!coupon.is_active)return 'This coupon is disabled.';
  if(new Date(coupon.starts_at).getTime()>now)return 'This coupon is not active yet.';
  if(new Date(coupon.expires_at).getTime()<=now)return 'This coupon has expired.';
  if(coupon.usage_limit!==null&&Number(coupon.usage_count)>=Number(coupon.usage_limit))return 'This coupon has reached its usage limit.';
  if(userUsage>=Number(coupon.per_user_limit))return 'You have already used this coupon the maximum number of times.';
  return '';
}
