import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireUser} from '@/lib/auth';

let ready:Promise<void>|null=null;
function ensureReviewsTable(){
 if(!ready) ready=(async()=>{
  await db`create table if not exists course_reviews(id uuid primary key default gen_random_uuid(),course_id uuid not null references courses(id) on delete cascade,user_id uuid not null references users(id) on delete cascade,rating smallint not null check(rating between 1 and 5),review text not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(course_id,user_id))`;
  await db`create index if not exists course_reviews_course_idx on course_reviews(course_id,created_at desc)`;
 })();
 return ready;
}

async function getCourse(slug:string){
 const rows=await db`select id,is_free from courses where slug=${slug} and published=true limit 1`;
 return rows[0] as any;
}

async function hasAccess(userId:string,course:any){
 if(course.is_free)return true;
 const rows=await db`select id from enrollments where user_id=${userId} and course_id=${course.id} and revoked_at is null limit 1`;
 return rows.length>0;
}

export async function GET(_:Request,{params}:{params:Promise<{slug:string}>}){
 try{
  const user=await requireUser();
  await ensureReviewsTable();
  const {slug}=await params;
  const course=await getCourse(slug);
  if(!course)return NextResponse.json({error:'Course not found.'},{status:404});
  const [reviews,myReview]=await Promise.all([
   db`select r.id,r.rating,r.review,r.created_at,r.updated_at,u.name,u.username,u.avatar_url from course_reviews r join users u on u.id=r.user_id where r.course_id=${course.id} order by r.created_at desc limit 100`,
   db`select id,rating,review,created_at,updated_at from course_reviews where course_id=${course.id} and user_id=${user.id} limit 1`
  ]);
  return NextResponse.json({reviews,myReview:myReview[0]||null,isAdmin:user.role==='admin'});
 }catch(e:any){return NextResponse.json({error:e.message==='UNAUTHENTICATED'?'Authentication required':'Could not load reviews.'},{status:e.message==='UNAUTHENTICATED'?401:500})}
}

export async function POST(request:Request,{params}:{params:Promise<{slug:string}>}){
 try{
  const user=await requireUser();
  await ensureReviewsTable();
  const {slug}=await params;
  const course=await getCourse(slug);
  if(!course)return NextResponse.json({error:'Course not found.'},{status:404});
  if(!(await hasAccess(user.id,course)))return NextResponse.json({error:'Course access is required to leave a review.'},{status:403});
  const body=await request.json();
  const rating=Number(body.rating);
  const review=String(body.review||'').trim();
  if(!Number.isInteger(rating)||rating<1||rating>5)return NextResponse.json({error:'Rating must be between 1 and 5.'},{status:400});
  if(review.length<3||review.length>1000)return NextResponse.json({error:'Review must be between 3 and 1000 characters.'},{status:400});
  const rows=await db`insert into course_reviews(course_id,user_id,rating,review,updated_at) values(${course.id},${user.id},${rating},${review},now()) on conflict(course_id,user_id) do update set rating=excluded.rating,review=excluded.review,updated_at=now() returning id,rating,review,created_at,updated_at`;
  return NextResponse.json({review:rows[0]});
 }catch(e:any){return NextResponse.json({error:e.message==='UNAUTHENTICATED'?'Authentication required':'Could not save review.'},{status:e.message==='UNAUTHENTICATED'?401:400})}
}

export async function DELETE(request:Request,{params}:{params:Promise<{slug:string}>}){
 try{
  const user=await requireUser();
  if(user.role!=='admin')return NextResponse.json({error:'Admin access required.'},{status:403});
  await ensureReviewsTable();
  const {slug}=await params;
  const course=await getCourse(slug);
  if(!course)return NextResponse.json({error:'Course not found.'},{status:404});
  const body=await request.json().catch(()=>({}));
  const reviewId=String(body.id||'');
  if(!reviewId)return NextResponse.json({error:'Review id is required.'},{status:400});
  const rows=await db`delete from course_reviews where id=${reviewId} and course_id=${course.id} returning id`;
  if(!rows.length)return NextResponse.json({error:'Review not found.'},{status:404});
  return NextResponse.json({ok:true});
 }catch(e:any){return NextResponse.json({error:e.message==='UNAUTHENTICATED'?'Authentication required':'Could not delete review.'},{status:e.message==='UNAUTHENTICATED'?401:500})}
}
