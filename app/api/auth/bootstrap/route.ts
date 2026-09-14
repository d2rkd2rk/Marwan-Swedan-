import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {adminEmail,hashPassword,validPassword} from '@/lib/auth';

export async function POST(request:Request){
  try{
    const secret=process.env.ADMIN_BOOTSTRAP_SECRET||'';
    if(!secret||request.headers.get('x-admin-bootstrap-secret')!==secret)return NextResponse.json({error:'Bootstrap is not available.'},{status:403});
    const body=await request.json();
    const password=String(body.password||'');
    if(!validPassword(password))return NextResponse.json({error:'Password must be 8+ characters with a number and special character.'},{status:400});
    const existing=await db`select id from users where role='admin' or lower(email)=lower(${adminEmail}) limit 1`;
    if(existing.length)return NextResponse.json({error:'Administrator account already exists.'},{status:409});
    const passwordHash=await hashPassword(password);
    const rows=await db`insert into users(name,email,whatsapp,username,password_hash,role) values('Marwan Swedan',${adminEmail},'201515227612','marwan_swedan',${passwordHash},'admin') returning id,name,email,whatsapp,username,role`;
    return NextResponse.json({user:rows[0]});
  }catch{return NextResponse.json({error:'Admin setup failed.'},{status:500})}
}
