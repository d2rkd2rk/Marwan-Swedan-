import {NextResponse} from 'next/server';
import {put} from '@vercel/blob';
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
    const name=String(b.name||'').trim();
    const type=String(b.type||'application/octet-stream');
    const size=Number(b.size||0);
    if(!name)return NextResponse.json({error:'File name is required.'},{status:400});
    if(!allowed.has(type))return NextResponse.json({error:'File type is not allowed.'},{status:400});
    if(!Number.isFinite(size)||size<=0||size>5_000_000_000)return NextResponse.json({error:'File size must be between 1 byte and 5 GB.'},{status:400});
    const courseId=String(b.courseId||'uploads').replace(/[^a-zA-Z0-9_-]/g,'')||'uploads';
    const pathname=`courses/${courseId}/${crypto.randomUUID()}-${name.replace(/[^a-zA-Z0-9._-]/g,'-')}`;

    // Public Blob: the playlist remains protected by the app, while the actual
    // media URL is stable and directly playable by browsers.
    const blob=await put(pathname,b.file||new Blob([]),{access:'public',contentType:type,addRandomSuffix:false});
    return NextResponse.json({url:blob.url,pathname:blob.pathname,name,type});
  }catch(e:any){
    console.error('UPLOAD_FAILED',e?.message||e);
    return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Could not upload file.'},{status:e.message==='FORBIDDEN'?403:503});
  }
}
