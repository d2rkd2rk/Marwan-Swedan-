import {NextRequest,NextResponse} from 'next/server';
import {get,issueSignedToken,presignUrl} from '@vercel/blob';

function validPath(pathname:string){
  const parts=pathname.split('/');
  return parts.length>=3&&['courses','profiles'].includes(parts[0])&&Boolean(parts[1]);
}

function responseHeaders(contentType:string,size?:number){
  const headers=new Headers();
  headers.set('Content-Type',contentType||'application/octet-stream');
  if(Number.isFinite(size))headers.set('Content-Length',String(size));
  headers.set('Cache-Control','private, no-store');
  headers.set('X-Content-Type-Options','nosniff');
  headers.set('Content-Disposition',contentType==='application/pdf'?'inline':'attachment');
  return headers;
}

export async function GET(request:NextRequest){
  const pathname=request.nextUrl.searchParams.get('pathname');
  if(!pathname)return new NextResponse('Missing pathname',{status:400});
  if(!validPath(pathname))return new NextResponse('Not found',{status:404});

  // Primary path: Vercel Blob private server-side read.
  try{
    const result=await get(pathname,{access:'private'});
    if(result?.statusCode===200&&result.stream){
      return new NextResponse(result.stream,{status:200,headers:responseHeaders(result.blob.contentType,result.blob.size)});
    }
  }catch(e:any){
    console.error('BLOB_GET_FAILED',e?.message||e);
  }

  // Fallback: create a short-lived signed GET and fetch it from the server.
  try{
    const expires=Date.now()+10*60*1000;
    const token=await issueSignedToken({pathname,operations:['get'],validUntil:expires});
    const {presignedUrl}=await presignUrl(token,{pathname,operation:'get',validUntil:expires,access:'private'});
    const upstream=await fetch(presignedUrl,{cache:'no-store',redirect:'follow'});
    if(upstream.ok){
      const contentType=upstream.headers.get('content-type')||'application/octet-stream';
      const length=upstream.headers.get('content-length');
      const headers=responseHeaders(contentType,length?Number(length):undefined);
      return new NextResponse(upstream.body,{status:200,headers});
    }
    console.error('BLOB_SIGNED_FETCH_FAILED',{status:upstream.status,statusText:upstream.statusText});
  }catch(e:any){
    console.error('BLOB_SIGNED_FETCH_ERROR',e?.message||e);
  }

  return new NextResponse('Not found',{status:404});
}
