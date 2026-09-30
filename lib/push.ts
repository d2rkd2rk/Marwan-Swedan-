import webpush from 'web-push';
import db from '@/lib/db';

type PushSubscriptionRecord={endpoint:string;keys:{p256dh:string;auth:string}};

function configured(){
 return Boolean(process.env.VAPID_PUBLIC_KEY&&process.env.VAPID_PRIVATE_KEY&&process.env.VAPID_SUBJECT);
}

if(configured())webpush.setVapidDetails(process.env.VAPID_SUBJECT!,process.env.VAPID_PUBLIC_KEY!,process.env.VAPID_PRIVATE_KEY!);

export function vapidPublicKey(){return process.env.VAPID_PUBLIC_KEY||''}

export async function ensurePushTable(){
 await db`create table if not exists push_subscriptions(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
 )`;
 await db`create index if not exists push_subscriptions_user_idx on push_subscriptions(user_id,last_used_at desc)`;
}

export async function sendCourseNotification(courseId:string,title:string){
 if(!configured())return;
 await ensurePushTable();
 const rows=await db`select ps.id,ps.endpoint,ps.p256dh,ps.auth from push_subscriptions ps join enrollments e on e.user_id=ps.user_id where e.course_id=${courseId} and e.revoked_at is null`;
 await Promise.all(rows.map(async(row:any)=>{
  const sub:PushSubscriptionRecord={endpoint:row.endpoint,keys:{p256dh:row.p256dh,auth:row.auth}};
  try{
   await webpush.sendNotification(sub,JSON.stringify({title:'New lesson · Marwan Swedan Academy',body:title,url:`/courses`,tag:`course-${courseId}`}));
   await db`update push_subscriptions set last_used_at=now() where id=${row.id}`;
  }catch(error:any){
   if(error?.statusCode===404||error?.statusCode===410)await db`delete from push_subscriptions where id=${row.id}`;
  }
 }));
}