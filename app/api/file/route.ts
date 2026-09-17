import {NextRequest,NextResponse} from 'next/server';
import {get} from '@vercel/blob';

export async function GET(request:NextRequest){
  try{
    const pathname=request.nextUrl.searchParams.get('pathname');
    if(!pathname)return new NextResponse('Missing pathname',{status:400});
    const parts=pathname.split('/');
    if(parts.length<3||!['courses','profiles'].includes(parts[0])||!parts[1])return new NextResponse('Not found',{status:404});

    // Keep the Blob private, but proxy the object through our app.
    // This avoids relying on the browser following a private Blob redirect.
    const result=await get(pathname,{access:'private'});
    if(!result||result.statusCode!==200)return new NextResponse('Not found',{status:404});

    const headers=new Headers();
    headers.set('Content-Type',result.blob.contentType||'application/octet-stream');
    headers.set('Content-Length',String(result.blob.size));
    headers.set('Cache-Control','private, no-store');
    headers.set('X-Content-Type-Options','nosniff');
    headers.set('Content-Disposition',result.blob.contentType==='application/pdf'?'inline':'attachment');
    return new NextResponse(result.stream,{status:200,headers});
  }catch(e:any){
    console.error('FILE_ACCESS_FAILED',e?.message||e);
    return new NextResponse('File unavailable',{status:404});
  }
}
