import {NextRequest,NextResponse} from 'next/server';
import {issueSignedToken,presignUrl} from '@vercel/blob';

export async function GET(request:NextRequest){
  try{
    const pathname=request.nextUrl.searchParams.get('pathname');
    if(!pathname)return new NextResponse('Missing pathname',{status:400});
    const parts=pathname.split('/');
    if(parts.length<3||!['courses','profiles'].includes(parts[0])||!parts[1])return new NextResponse('Not found',{status:404});

    // Generate a short-lived private GET URL, then proxy that response through our app.
    // This avoids relying on @vercel/blob get() for the server-side read path.
    const expires=Date.now()+10*60*1000;
    const token=await issueSignedToken({pathname,operations:['get'],validUntil:expires});
    const {presignedUrl}=await presignUrl(token,{pathname,operation:'get',validUntil:expires,access:'private'});
    const upstream=await fetch(presignedUrl,{cache:'no-store',redirect:'follow'});
    if(!upstream.ok)return new NextResponse('Not found',{status:404});

    const headers=new Headers();
    headers.set('Content-Type',upstream.headers.get('content-type')||'application/octet-stream');
    const length=upstream.headers.get('content-length');
    if(length)headers.set('Content-Length',length);
    headers.set('Cache-Control','private, no-store');
    headers.set('X-Content-Type-Options','nosniff');
    headers.set('Content-Disposition',upstream.headers.get('content-type')==='application/pdf'?'inline':'attachment');
    return new NextResponse(upstream.body,{status:200,headers});
  }catch(e:any){
    console.error('FILE_ACCESS_FAILED',e?.message||e);
    return new NextResponse('File unavailable',{status:404});
  }
}
