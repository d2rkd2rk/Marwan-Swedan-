import db from './db';

export function clientIp(request:Request){return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||request.headers.get('x-real-ip')||'unknown'}
export function suspicious(request:Request){const h=request.headers.get('user-agent')||'';return h.length<8||/headless|selenium|puppeteer/i.test(h)}
export async function audit(userId:string|null,action:string,request:Request,metadata:Record<string,unknown>={}){if(!process.env.DATABASE_URL)return;await db`insert into audit_logs(user_id,action,ip,metadata) values(${userId},${action},${clientIp(request)},${JSON.stringify(metadata)}::jsonb)`}
export async function securityEvent(userId:string|null,eventType:string,severity:string,request:Request,metadata:Record<string,unknown>={}){if(!process.env.DATABASE_URL)return;await db`insert into security_events(user_id,event_type,severity,ip,metadata) values(${userId},${eventType},${severity},${clientIp(request)},${JSON.stringify(metadata)}::jsonb)`}
export async function blockFor24Hours(userId:string,request:Request,reason:string){if(!process.env.DATABASE_URL)return;await db`update users set is_blocked=true,blocked_until=now()+interval '24 hours' where id=${userId}`;await securityEvent(userId,'automatic_24h_block','high',request,{reason})}
