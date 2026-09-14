import {cookies} from 'next/headers';
import {jwtVerify,SignJWT} from 'jose';
import bcrypt from 'bcryptjs';
import db from './db';

const secret=new TextEncoder().encode(process.env.SESSION_SECRET||'development-only-change-me');
const cookieName='marwan_session';

export async function hashPassword(password:string){return bcrypt.hash(password,12)}
export async function verifyPassword(password:string,hash:string){return bcrypt.compare(password,hash)}
export async function createSession(user:{id:string,role:string,username:string}){
  const token=await new SignJWT({uid:user.id,role:user.role,username:user.username}).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime('7d').sign(secret);
  const jar=await cookies();
  jar.set(cookieName,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*7});
}
export async function destroySession(){(await cookies()).set(cookieName,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0})}
export async function session(){
  const token=(await cookies()).get(cookieName)?.value;
  if(!token)return null;
  try{
    const {payload}=await jwtVerify(token,secret);
    if(typeof payload.uid!=='string')return null;
    const rows=await db`select id,name,email,whatsapp,username,role,is_blocked,blocked_until,bio,avatar_url,cv_url,cv_name from users where id=${payload.uid} limit 1`;
    const user=rows[0] as any;
    if(!user)return null;
    if(user.is_blocked && user.blocked_until && new Date(user.blocked_until)>new Date())return null;
    return user;
  }catch{return null}
}
export async function requireUser(){const user=await session();if(!user)throw new Error('UNAUTHENTICATED');return user}
export async function requireAdmin(){const user=await requireUser();if(user.role!=='admin')throw new Error('FORBIDDEN');return user}
export function validPassword(password:string){return password.length>=8&&/[0-9]/.test(password)&&/[^A-Za-z0-9]/.test(password)}
export const adminEmail=process.env.ADMIN_EMAIL||'202501259@pua.edu.eg';