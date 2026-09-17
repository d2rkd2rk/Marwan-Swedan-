import {NextRequest,NextResponse} from 'next/server';
import {issueSignedToken,presignUrl} from '@vercel/blob';

export async function GET(request:NextRequest){
 try{
  const pathname=request.nextUrl.searchParams.get('pathname');
  if(!pathname)return new NextResponse('Missing pathname',{status:400});
  const parts=pathname.split('/');
  if(parts.length<3||!['courses','profiles'].includes(parts[0])||!parts[1])return new NextResponse('Not found',{status:404});
  // Files are intentionally unlisted: the playlist/account UI controls where the links are shown,
  // while the Blob URL is protected by a short-lived signed GET token.
  const expires=Date.now()+10*60*1000;
  const token=await issueSignedToken({pathname,operations:['get'],validUntil:expires});
  const {presignedUrl}=await presignUrl(token,{pathname,operation:'get',validUntil:expires,access:'private'});
  return NextResponse.redirect(presignedUrl,302);
 }catch(e:any){console.error('FILE_ACCESS_FAILED',e);return new NextResponse('File unavailable',{status:404})}
}
