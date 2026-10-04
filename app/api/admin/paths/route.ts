import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {requireAdmin} from '@/lib/auth';
import {audit} from '@/lib/security';
import {ensurePathTables} from '@/lib/pathAccess';

async function ensureWhatsAppNumber(){await db`alter table paths add column if not exists whatsapp_number text`}
function makeSlug(value:string){const base=value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');return base||`path-${Date.now()}`}
async function uniqueSlug(raw:string,id?:string){
 const base=makeSlug(raw);
 const rows=id?await db`select id from paths where slug=${base} and id<>${id} limit 1`:await db`select id from paths where slug=${base} limit 1`;
 return rows.length?`${base}-${Date.now().toString().slice(-6)}`:base;
}
async function enrich(rows:any[]){
 if(!rows.length)return rows;
 const ids=rows.map(x=>x.id);
 const stats=await db`select p.id,count(pc.course_id)::int as course_count,coalesce(sum(c.duration_minutes),0)::int as duration_minutes
   from paths p left join path_courses pc on pc.path_id=p.id left join courses c on c.id=pc.course_id
   where p.id = any(${ids}::uuid[]) group by p.id`;
 const map=new Map(stats.map((x:any)=>[x.id,x]));
 return rows.map(x=>({...x,course_count:Number(map.get(x.id)?.course_count||0),duration_minutes:Number(map.get(x.id)?.duration_minutes||0)}));
}
export async function GET(){
 try{
  await requireAdmin(); await ensurePathTables(); await ensureWhatsAppNumber();
  return NextResponse.json({paths:await enrich(await db`select * from paths order by created_at desc`)});
 }catch(e:any){return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Authentication required'},{status:e.message==='FORBIDDEN'?403:401})}
}
export async function POST(request:Request){
 try{
  const admin=await requireAdmin(); await ensurePathTables(); await ensureWhatsAppNumber();
  const b=await request.json();
  const title=String(b.title||'Untitled Path').trim()||'Untitled Path';
  const slug=await uniqueSlug(String(b.slug||title));
  const description=String(b.description||'').trim();
  const category=String(b.category||'Cybersecurity').trim()||'Cybersecurity';
  const level=String(b.level||'Beginner').trim()||'Beginner';
  const isFree=Boolean(b.isFree),price=isFree?0:Math.max(0,Number(b.price||0));
  const whatsappNumber=String(b.whatsappNumber||'').trim();
  if(whatsappNumber&&!/^\d{8,15}$/.test(whatsappNumber))return NextResponse.json({error:'WhatsApp number must be 8–15 digits in international format, without +, spaces, or dashes.'},{status:400});
  const rows=await db`insert into paths(title,slug,description,category,level,thumbnail_url,is_free,price,published,whatsapp_number)
    values(${title},${slug},${description},${category},${level},${b.thumbnailUrl||null},${isFree},${price},${Boolean(b.published)},${whatsappNumber||null}) returning *`;
  await audit(admin.id,'create_path',request,{pathId:rows[0].id});
  return NextResponse.json({path:rows[0]},{status:201});
 }catch(e:any){return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Could not create path'},{status:e.message==='FORBIDDEN'?403:400})}
}
export async function PUT(request:Request){
 try{
  const admin=await requireAdmin(); await ensurePathTables(); await ensureWhatsAppNumber();
  const b=await request.json(); const id=String(b.id||''); if(!id)return NextResponse.json({error:'Path id is required.'},{status:400});
  const title=String(b.title||'Untitled Path').trim()||'Untitled Path';
  const slug=await uniqueSlug(String(b.slug||title),id);
  const isFree=Boolean(b.isFree),price=isFree?0:Math.max(0,Number(b.price||0));
  const whatsappNumber=String(b.whatsappNumber||'').trim();
  if(whatsappNumber&&!/^\d{8,15}$/.test(whatsappNumber))return NextResponse.json({error:'WhatsApp number must be 8–15 digits in international format, without +, spaces, or dashes.'},{status:400});
  const rows=await db`update paths set title=${title},slug=${slug},description=${String(b.description||'')},category=${String(b.category||'Cybersecurity')},level=${String(b.level||'Beginner')},thumbnail_url=${b.thumbnailUrl||null},is_free=${isFree},price=${price},published=${Boolean(b.published)},whatsapp_number=${whatsappNumber||null},updated_at=now() where id=${id} returning *`;
  if(!rows.length)return NextResponse.json({error:'Path not found.'},{status:404});
  await audit(admin.id,'update_path',request,{pathId:id});
  return NextResponse.json({path:rows[0]});
 }catch(e:any){return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Could not update path'},{status:e.message==='FORBIDDEN'?403:400})}
}
export async function DELETE(request:Request){
 try{
  const admin=await requireAdmin(); await ensurePathTables();
  const {id}=await request.json(); if(!id)return NextResponse.json({error:'Path id is required.'},{status:400});
  await db`delete from paths where id=${id}`; await audit(admin.id,'delete_path',request,{pathId:id});
  return NextResponse.json({ok:true});
 }catch(e:any){return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Could not delete path'},{status:e.message==='FORBIDDEN'?403:400})}
}
