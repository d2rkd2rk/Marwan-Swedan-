import {NextResponse} from 'next/server';
import {GetObjectCommand,S3Client} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import db from '@/lib/db';
import {requireAdmin} from '@/lib/auth';
import {ensurePaymentSchema} from '@/lib/payments';
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
 try{
  await requireAdmin();await ensurePaymentSchema();const {id}=await params;
  const rows=await db.unsafe("select receipt_key from payment_requests where id=$1 limit 1",[id]);if(!rows.length)return NextResponse.json({error:'Payment request not found.'},{status:404});
  const accessKeyId=process.env.TIGRIS_STORAGE_ACCESS_KEY_ID,secretAccessKey=process.env.TIGRIS_STORAGE_SECRET_ACCESS_KEY,Bucket=process.env.TIGRIS_STORAGE_BUCKET;
  if(!accessKeyId||!secretAccessKey||!Bucket)return NextResponse.json({error:'Receipt storage is not configured.'},{status:503});
  const client=new S3Client({region:'auto',endpoint:'https://t3.storage.dev',credentials:{accessKeyId,secretAccessKey}});
  const url=await getSignedUrl(client,new GetObjectCommand({Bucket,Key:rows[0].receipt_key}),{expiresIn:120});return NextResponse.json({url});
 }catch(e:any){return NextResponse.json({error:e.message==='FORBIDDEN'?'Forbidden':'Authentication required'},{status:e.message==='FORBIDDEN'?403:401})}
}
