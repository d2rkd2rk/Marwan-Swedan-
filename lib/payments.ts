import db from '@/lib/db';
import {ensureCouponSchema} from '@/lib/coupons';
let schemaPromise:Promise<void>|null=null;
export async function ensurePaymentSchema(){
 if(!schemaPromise){
  schemaPromise=(async()=>{
   await ensureCouponSchema();
   await db.unsafe("create table if not exists payment_settings(id smallint primary key default 1 check(id=1),instapay_address text not null default '',account_name text not null default '',instructions text not null default '',updated_by uuid references users(id) on delete set null,updated_at timestamptz not null default now())");
   await db.unsafe("insert into payment_settings(id) values(1) on conflict(id) do nothing");
   await db.unsafe("create table if not exists payment_requests(id uuid primary key default gen_random_uuid(),user_id uuid not null references users(id) on delete cascade,course_id uuid not null references courses(id) on delete cascade,coupon_id uuid references discount_coupons(id) on delete set null,coupon_code text,original_price numeric(12,2) not null,discount_amount numeric(12,2) not null default 0,amount numeric(12,2) not null,sender_phone text not null,sender_name text not null,transaction_reference text,receipt_key text not null,status text not null default 'pending' check(status in ('pending','approved','declined')),decline_reason text,reviewed_by uuid references users(id) on delete set null,reviewed_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now())");
   await db.unsafe("create unique index if not exists payment_requests_one_pending_idx on payment_requests(user_id,course_id) where status='pending'");
   await db.unsafe("create index if not exists payment_requests_status_created_idx on payment_requests(status,created_at desc)");
   await db.unsafe("create index if not exists payment_requests_approved_at_idx on payment_requests(reviewed_at desc) where status='approved'");
   await db.unsafe("create index if not exists payment_requests_user_idx on payment_requests(user_id,created_at desc)");
   await db.unsafe("alter table enrollments add column if not exists source text not null default 'admin'");
  })().catch(error=>{schemaPromise=null;throw error});
 }
 return schemaPromise;
}
export function safeReceiptKey(key:string,userId:string){return key.startsWith('payment-receipts/'+userId+'/')&&!key.includes('..')&&!key.includes('\\\\')}
