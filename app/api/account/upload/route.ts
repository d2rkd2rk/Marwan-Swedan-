import {NextResponse} from 'next/server';
import {PutObjectCommand,S3Client} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
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
    const accessKeyId=process.env.TIGRIS_STORAGE_ACCESS_KEY_ID;
    const secretAccessKey=process.env.TIGRIS_STORAGE_SECRET_ACCESS_KEY;
    const Bucket=process.env.TIGRIS_STORAGE_BUCKET;
    if(!accessKeyId||!secretAccessKey||!Bucket)throw new Error('TIGRIS_NOT_CONFIGURED');
    const client=new S3Client({region:'auto',endpoint:'https://t3.storage.dev',forcePathStyle:false,credentials:{accessKeyId,secretAccessKey}});
    const uploadUrl=await getSignedUrl(client,new PutObjectCommand({Bucket,Key:pathname,ContentType:type}),{expiresIn:15*60});
    return NextResponse.json({uploadUrl,url:`/api/file?key=${encodeURIComponent(pathname)}`,pathname,name:safeName,kind});
  }catch(e:any){return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':e.message==='TIGRIS_NOT_CONFIGURED'?'Tigris storage is not configured':'Could not prepare upload'},{status:e.message==='UNAUTHENTICATED'?401:e.message==='TIGRIS_NOT_CONFIGURED'?503:400})}
}
