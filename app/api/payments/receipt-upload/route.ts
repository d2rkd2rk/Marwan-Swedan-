import {NextResponse} from 'next/server';
import {PutObjectCommand,S3Client} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {randomUUID} from 'crypto';
import {requireUser} from '@/lib/auth';
const allowed=new Set(['image/jpeg','image/png','image/webp','application/pdf']);
export async function POST(request:Request){
 try{
  const user=await requireUser();if(user.role==='admin')return NextResponse.json({error:'Not available for admins.'},{status:403});
  const b=await request.json(),name=String(b.name||'receipt').trim(),type=String(b.type||''),size=Number(b.size||0);
  if(!allowed.has(type)||!Number.isFinite(size)||size<1||size>10*1024*1024)return NextResponse.json({error:'Upload a JPG, PNG, WebP or PDF receipt up to 10 MB.'},{status:400});
  const accessKeyId=process.env.TIGRIS_STORAGE_ACCESS_KEY_ID,secretAccessKey=process.env.TIGRIS_STORAGE_SECRET_ACCESS_KEY,Bucket=process.env.TIGRIS_STORAGE_BUCKET;
  if(!accessKeyId||!secretAccessKey||!Bucket)return NextResponse.json({error:'Receipt storage is not configured.'},{status:503});
  const client=new S3Client({region:'auto',endpoint:'https://t3.storage.dev',credentials:{accessKeyId,secretAccessKey}});
  const key='payment-receipts/'+user.id+'/'+randomUUID()+'-'+name.replace(/[^a-zA-Z0-9._-]/g,'-');
  const uploadUrl=await getSignedUrl(client,new PutObjectCommand({Bucket,Key:key,ContentType:type}),{expiresIn:900});
  return NextResponse.json({uploadUrl,key});
 }catch(e:any){return NextResponse.json({error:e.message==='UNAUTHENTICATED'?'Authentication required':'Could not prepare receipt upload.'},{status:e.message==='UNAUTHENTICATED'?401:500})}
}
