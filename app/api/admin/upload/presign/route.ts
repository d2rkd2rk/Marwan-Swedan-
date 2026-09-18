import {NextResponse} from 'next/server';
import {PutBucketCorsCommand,PutObjectCommand,S3Client} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {requireAdmin} from '@/lib/auth';

const allowed=new Set([
  'image/jpeg','image/png','image/webp','image/gif','image/avif',
  'video/mp4','video/webm','video/quicktime','audio/mpeg','audio/mp4',
  'application/pdf','application/zip','application/x-zip-compressed','text/plain','text/markdown',
  'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation'
]);

function storage(){
  const accessKeyId=process.env.TIGRIS_STORAGE_ACCESS_KEY_ID;
  const secretAccessKey=process.env.TIGRIS_STORAGE_SECRET_ACCESS_KEY;
  const Bucket=process.env.TIGRIS_STORAGE_BUCKET;
  if(!accessKeyId||!secretAccessKey||!Bucket)throw new Error('TIGRIS_NOT_CONFIGURED');
  return {
    Bucket,
    client:new S3Client({
      region:'auto',
      endpoint:'https://t3.storage.dev',
      credentials:{accessKeyId,secretAccessKey},
      forcePathStyle:false
    })
  };
}

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

  const {Bucket,client}=storage();
  const courseId=String(b.courseId||'uploads').replace(/[^a-zA-Z0-9_-]/g,'')||'uploads';
  const key=`courses/${courseId}/${crypto.randomUUID()}-${name.replace(/[^a-zA-Z0-9._-]/g,'-')}`;
  try {
    await client.send(new PutBucketCorsCommand({
      Bucket,
      CORSConfiguration:{
        CORSRules:[{
          AllowedOrigins:['*'],
          AllowedMethods:['PUT','GET','HEAD'],
          AllowedHeaders:['*'],
          ExposeHeaders:['ETag'],
          MaxAgeSeconds:86400
        }]
      }
    }));
  } catch (corsError:any) {
    console.warn('TIGRIS_CORS_SETUP_FAILED', corsError?.message || corsError);
  }
  const uploadUrl=await getSignedUrl(
    client,
    new PutObjectCommand({Bucket,Key:key,ContentType:type}),
    {expiresIn:15*60}
  );

  return NextResponse.json({
    uploadUrl,
    url:`/api/file?key=${encodeURIComponent(key)}`,
    key,
    name,
    type
  });
 }catch(e:any){
  console.error('PREPARE_MEDIA_UPLOAD_FAILED',e?.message||e);
  const status=e?.message==='FORBIDDEN'?403:e?.message==='TIGRIS_NOT_CONFIGURED'?503:500;
  return NextResponse.json({error:e?.message==='FORBIDDEN'?'Forbidden':e?.message==='TIGRIS_NOT_CONFIGURED'?'Tigris storage is not configured on this deployment.':'Could not prepare upload.'},{status});
 }
}
