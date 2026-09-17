import {NextRequest,NextResponse} from 'next/server';
import {get} from '@vercel/blob';

function validPath(pathname:string){
 const parts=pathname.split('/');
 return parts.length>=3&&['courses','profiles'].includes(parts[0])&&Boolean(parts[1]);
}

export async function GET(request:NextRequest){
 try{
  const pathname=request.nextUrl.searchParams.get('pathname');
  if(!pathname)return new NextResponse('Missing pathname',{status:400});
  if(!validPath(pathname))return new NextResponse('Not found',{status:404});
  const result=await get(pathname,{access:'public'});
  if(!result||result.statusCode!==200||!result.stream)return new NextResponse('Not found',{status:404});
  const headers=new Headers();
  headers.set('Content-Type',result.blob.contentType||'application/octet-stream');
  headers.set('Cache-Control','public, max-age=31536000, immutable');
  headers.set('X-Content-Type-Options','nosniff');
  headers.set('Content-Disposition',result.blob.contentType==='application/pdf'?'inline':'attachment');
  return new NextResponse(result.stream,{status:200,headers});
 }catch(e:any){
  console.error('FILE_ACCESS_FAILED',e?.message||e);
  return new NextResponse('File unavailable',{status:404});
 }
}
