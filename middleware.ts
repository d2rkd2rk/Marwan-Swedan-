import {NextRequest,NextResponse} from 'next/server';
export function middleware(request:NextRequest){
 const host=request.headers.get('host')?.split(':')[0]||'';
 if(host&&host!=='marwan-swedan.vercel.app'&&host.endsWith('.vercel.app'))return NextResponse.redirect(new URL(request.nextUrl.pathname+request.nextUrl.search,'https://marwan-swedan.vercel.app'),308);
 if(request.nextUrl.pathname==='/')return NextResponse.rewrite(new URL('/landing',request.url));
 return NextResponse.next();
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
