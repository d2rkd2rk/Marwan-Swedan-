import {NextResponse} from 'next/server';
import {issueSignedToken,presignUrl} from '@vercel/blob';
import {requireUser} from '@/lib/auth';

export async function POST(request:Request){
  try{
    const user=await requireUser();
    const body=await request.json();
    const kind=String(body.kind||'');
    const name=String(body.name||'').trim();
    const type=String(body.type||'application/octet-stream');
    const size=Number(body.size||0);
    const imageTypes=new Set(['image/jpeg','image/png','image/webp']);
    const allowed=kind==='avatar'?imageTypes.has(type):kind==='cv'&&type==='application/pdf';
    const max=kind==='avatar'?8_000_000:15_000_000;
    if(!name||!allowed||!Number.isFinite(size)||size<=0||size>max)return NextResponse.json({error:'Unsupported file or size.'},{status:400});
    const safeName=name.replace(/[^a-zA-Z0-9._-]/g,'-');
    const pathname=`profiles/${user.id}/${kind}/${crypto.randomUUID()}-${safeName}`;
    const expires=Date.now()+15*60*1000;
    const token=await issueSignedToken({pathname,operations:['put'],validUntil:expires,allowedContentTypes:[type],maximumSizeInBytes:size});
    const {presignedUrl}=await presignUrl(token,{pathname,operation:'put',validUntil:expires});
    return NextResponse.json({uploadUrl:presignedUrl,url:`/api/file?pathname=${encodeURIComponent(pathname)}`,pathname,name:safeName,kind});
  }catch(e:any){return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Could not prepare upload'},{status:e.message==='UNAUTHENTICATED'?401:400})}
}
