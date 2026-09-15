import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {adminEmail,createRandomToken,hashToken} from '@/lib/auth';

export async function POST(request:Request){
  try{
    const secret=process.env.ADMIN_BOOTSTRAP_SECRET||'';
    if(!secret||request.headers.get('x-admin-bootstrap-secret')!==secret)return NextResponse.json({error:'Forbidden'},{status:403});
    const rows=await db`select id from users where lower(email)=lower(${adminEmail}) and role='admin' limit 1`;
    if(!rows.length)return NextResponse.json({error:'Administrator account does not exist yet.'},{status:404});
    await db`delete from admin_login_links where used_at is not null or expires_at<=now()`;
    const raw=createRandomToken();
    await db`insert into admin_login_links(user_id,token_hash,expires_at) values(${rows[0].id},${hashToken(raw)},now()+interval '15 minutes')`;
    const base=(process.env.NEXT_PUBLIC_SITE_URL||'').replace(/\/$/,'');
    if(!base)return NextResponse.json({error:'Site URL is not configured.'},{status:503});
    return NextResponse.json({url:`${base}/api/auth/admin-login?token=${encodeURIComponent(raw)}`});
  }catch{return NextResponse.json({error:'Unable to create login link.'},{status:500})}
}