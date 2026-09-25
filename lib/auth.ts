import {cookies} from 'next/headers';
import {jwtVerify,SignJWT} from 'jose';
import bcrypt from 'bcryptjs';
import {createHash,randomBytes} from 'crypto';
import db from './db';

const secret=new TextEncoder().encode(process.env.SESSION_SECRET||'development-only-change-me');
const cookieName='marwan_session';
const trustedCookieName='marwan_trusted_device';

export async function hashPassword(password:string){return bcrypt.hash(password,12)}
export async function verifyPassword(password:string,hash:string){return bcrypt.compare(password,hash)}
export function hashToken(value:string){return createHash('sha256').update(value).digest('hex')}
export function createRandomToken(){return randomBytes(32).toString('hex')}

export async function createSession(user:{id:string,role:string,username:string}){
  const token=await new SignJWT({uid:user.id,role:user.role,username:user.username}).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime('7d').sign(secret);
  const jar=await cookies();
  jar.set(cookieName,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*7});
  await createTrustedDevice(user.id);
}

export async function createTrustedDevice(userId:string){
  const raw=createRandomToken();
  const tokenHash=hashToken(raw);
  await db`insert into trusted_devices(user_id,token_hash,expires_at) values(${userId},${tokenHash},now()+interval '90 days')`;
  const jar=await cookies();
  jar.set(trustedCookieName,raw,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*90});
}

export async function trustedDeviceValid(userId:string){
  const raw=(await cookies()).get(trustedCookieName)?.value;
  if(!raw)return false;
  const tokenHash=hashToken(raw);
  const rows=await db`select id from trusted_devices where user_id=${userId} and token_hash=${tokenHash} and expires_at>now() limit 1`;
  if(!rows.length)return false;
  await db`update trusted_devices set last_used_at=now() where id=${rows[0].id}`;
  return true;
}

export async function destroySession(){
  const jar=await cookies();
  const raw=jar.get(trustedCookieName)?.value;
  if(raw)await db`delete from trusted_devices where token_hash=${hashToken(raw)}`;
  jar.set(cookieName,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0});
  jar.set(trustedCookieName,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0});
}

export async function session(){
  const jar=await cookies();
  const token=jar.get(cookieName)?.value;
  if(token){
    try{
      const {payload}=await jwtVerify(token,secret);
      if(typeof payload.uid==='string'){
        const rows=await db`select id,name,email,whatsapp,username,role,is_blocked,blocked_until from users where id=${payload.uid} limit 1`;
        const user=rows[0] as any;
        if(user&&!(user.is_blocked&&user.blocked_until&&new Date(user.blocked_until)>new Date()))return user;
      }
    }catch{}
  }
  const raw=jar.get(trustedCookieName)?.value;
  if(!raw)return null;
  const tokenHash=hashToken(raw);
  const rows=await db`select u.id,u.name,u.email,u.whatsapp,u.username,u.role,u.is_blocked,u.blocked_until from trusted_devices d join users u on u.id=d.user_id where d.token_hash=${tokenHash} and d.expires_at>now() limit 1`;
  const user=rows[0] as any;
  if(!user)return null;
  if(user.is_blocked&&user.blocked_until&&new Date(user.blocked_until)>new Date())return null;
  await db`update trusted_devices set last_used_at=now() where token_hash=${tokenHash}`;
  return user;
}

export async function requireUser(){const user=await session();if(!user)throw new Error('UNAUTHENTICATED');return user}
export async function requireAdmin(){const user=await requireUser();if(user.role!=='admin')throw new Error('FORBIDDEN');return user}
export function validPassword(password:string){return password.length>=8&&/[A-Z]/.test(password)&&/[0-9]/.test(password)&&/[^A-Za-z0-9]/.test(password)}
export const adminEmail=process.env.ADMIN_EMAIL||'202501259@pua.edu.eg';