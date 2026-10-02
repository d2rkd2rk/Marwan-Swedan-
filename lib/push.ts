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

async function sendToCourseSubscribers(courseId:string,title:string,body:string,url:string,tag:string){
 if(!configured())throw new Error('PUSH_NOT_CONFIGURED');
 await ensurePushTable();
 const rows=await db`select ps.id,ps.endpoint,ps.p256dh,ps.auth from push_subscriptions ps join enrollments e on e.user_id=ps.user_id where e.course_id=${courseId} and e.revoked_at is null`;
 let sent=0,failed=0,expired=0;
 await Promise.all(rows.map(async(row:any)=>{
  const sub:PushSubscriptionRecord={endpoint:row.endpoint,keys:{p256dh:row.p256dh,auth:row.auth}};
  try{
   await webpush.sendNotification(sub,JSON.stringify({title,body,url,tag}),{TTL:3600,headers:{Urgency:'high'}});
   await db`update push_subscriptions set last_used_at=now() where id=${row.id}`;
   sent++;
  }catch(error:any){
   if(error?.statusCode===404||error?.statusCode===410){
    await db`delete from push_subscriptions where id=${row.id}`;
    expired++;
   }else{
    failed++;
    console.error('PUSH_DELIVERY_FAILED',{statusCode:error?.statusCode,body:error?.body});
   }
  }
 }));
 return {sent,failed,expired,total:rows.length};
}
export async function sendCourseNotification(courseId:string,lessonTitle:string){
 return await sendToCourseSubscribers(courseId,'New lesson · Marwan Swedan Academy',lessonTitle,'/courses',`course-${courseId}`);
}

export async function sendCourseAnnouncement(courseId:string,title:string,body:string){
 const safeTitle=title.trim(),safeBody=body.trim();
 if(!safeTitle||!safeBody)throw new Error('ANNOUNCEMENT_REQUIRED');
 return await sendToCourseSubscribers(courseId,safeTitle,safeBody,'/courses',`announcement-${courseId}-${Date.now()}`);
}
