import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {adminEmail,requireAdmin} from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const q = (new URL(request.url).searchParams.get('q') || '').trim().slice(0, 120);
    const excludedEmail = String(adminEmail).toLowerCase();
    const users = q
      ? await db`select id,name,email,username,whatsapp from users
          where lower(email) <> lower(${excludedEmail})
            and coalesce(role,'student') <> 'admin'
            and (name ilike ${'%'+q+'%'} or username ilike ${'%'+q+'%'} or email ilike ${'%'+q+'%'} or whatsapp ilike ${'%'+q+'%'})
          order by created_at desc`
      : await db`select id,name,email,username,whatsapp from users
          where lower(email) <> lower(${excludedEmail})
            and coalesce(role,'student') <> 'admin'
          order by created_at desc limit 50`;
    return NextResponse.json({users});
  } catch (error: any) {
    const forbidden = error?.message === 'FORBIDDEN';
    const unauthenticated = error?.message === 'UNAUTHENTICATED';
    return NextResponse.json({error: forbidden ? 'Forbidden' : unauthenticated ? 'Authentication required' : 'Could not load recipients.'}, {status: forbidden ? 403 : unauthenticated ? 401 : 500});
  }
}
