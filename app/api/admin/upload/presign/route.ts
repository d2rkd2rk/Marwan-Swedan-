import {NextResponse} from 'next/server';
import {issueSignedToken,presignUrl} from '@vercel/blob';
import {requireAdmin} from '@/lib/auth';

const allowed=new Set([
  'image/jpeg','image/png','image/webp','image/gif','image/avif',
  'video/mp4','video/webm','video/quicktime','audio/mpeg','audio/mp4',
  'application/pdf','application/zip','application/x-zip-compressed','text/plain','text/markdown',
  'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation'
]);

export async function POST(request:Request){
 try{
  await requireAdmin();
  const b=await request.json();
  const name=String(b.name||'').trim(),type=String(b.type||'application/octet-stream'),size=Number(b.size||0);
  if(!name)return NextResponse.json({error:'File name is required.'},{status:400});
  if(!allowed.has(type))return NextResponse.json({error:'File type is not allowed.'},{status:400});
  if(!Number.isFinite(size)||size<=0||size>5_000_000_000)return NextResponse.json({error:'File size must be between 1 byte and 5 GB.'},{status:400});
  const courseId=String(b.courseId||'uploads').replace(/[^a-zA-Z0-9_-]/g,'')||'uploads';
  const pathname=`courses/${courseId}/${crypto.randomUUID()}-${name.replace(/[^a-zA-Z0-9._-]/g,'-')}`;
  const expires=Date.now()+15*60*1000;
  const token=await issueSignedToken({pathname,operations:['put'],validUntil:expires,allowedContentTypes:[type],maximumSizeInBytes:size});
  const {presignedUrl}=await presignUrl(token,{pathname,operation:'put',validUntil:expires,access:'private'});
  return NextResponse.json({uploadUrl:presignedUrl,url:`/api/file?pathname=${encodeURIComponent(pathname)}`,pathname,name,type});
 }catch(e:any){console.error('PREPARE_MEDIA_UPLOAD_FAILED',e);return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Could not prepare upload. Check that Vercel Blob storage is connected.'},{status:e.message==='FORBIDDEN'?403:503})}
}
