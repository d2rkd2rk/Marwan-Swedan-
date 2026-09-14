import {NextResponse} from 'next/server';
import {session} from '@/lib/auth';
export async function GET(){const user=await session();return NextResponse.json({user:user?{id:user.id,name:user.name,email:user.email,whatsapp:user.whatsapp,username:user.username,role:user.role}:null})}