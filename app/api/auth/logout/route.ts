import {NextResponse} from 'next/server';
import {destroySession,session} from '@/lib/auth';
import {audit} from '@/lib/security';
export async function POST(request:Request){const user=await session();if(user)await audit(user.id,'logout',request);await destroySession();return NextResponse.json({ok:true})}