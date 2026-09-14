import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {adminEmail,hashPassword,validPassword} from '@/lib/auth';
export async function POST(request:Request){
  const secret=process.env.ADMIN_BOOTSTRAP_SECRET;
  if(!secret||secret!==request.headers.get('x-admin-bootstrap-secret'))return NextResponse.json({error:'Forbidden'},{status:403});
  const {name,password,whatsapp}=await request.json();
  if(!validPassword(String(password||'')))return NextResponse.json({error:'Password must be 8+ chars and include a number and special character.'},{status:400});
  const hash=await hashPassword(String(password));
  const rows=await db`insert into users(name,email,whatsapp,username,password_hash,role) values(${String(name||'Marwan Swedan')},${adminEmail},${String(whatsapp||process.env.WHATSAPP_ADMIN_NUMBER||'201515227612')},'admin',${hash},'admin') on conflict(email) do update set name=excluded.name,whatsapp=excluded.whatsapp,password_hash=excluded.password_hash,role='admin',is_blocked=false,blocked_until=null returning id,email,username,role`;
  return NextResponse.json({user:rows[0]});
}