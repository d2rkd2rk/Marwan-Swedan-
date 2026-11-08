'use client';
import {useEffect,useState} from 'react';
import {useParams,useSearchParams} from 'next/navigation';
import Link from 'next/link';
import SiteNav from '@/app/components/SiteNav';
export default function PaymentPage(){
 const params=useParams<{slug:string}>(),search=useSearchParams(),slug=params.slug,coupon=search.get('coupon')||'',targetType=search.get('type')==='path'?'path':'course';
 const [data,setData]=useState<any>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const [senderPhone,setSenderPhone]=useState(''),[senderName,setSenderName]=useState(''),[reference,setReference]=useState('');
 const [file,setFile]=useState<File|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{if(!slug)return;setLoading(true);fetch('/api/payments/checkout?slug='+encodeURIComponent(slug)+'&type='+targetType+(coupon?'&coupon='+encodeURIComponent(coupon):''),{cache:'no-store'}).then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.error||'Could not load payment page.');setData(j);setError('')}).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[slug,coupon,targetType]);
 const copy=async()=>{try{await navigator.clipboard.writeText('Account holder: '+(data?.settings?.account_name||'')+'\nInstaPay: '+(data?.settings?.instapay_address||''));setMessage('InstaPay details copied.')}catch{setMessage('Copy was not available on this browser.')}};
 const submit=async()=>{
  if(busy)return;setMessage('');
  if(!senderPhone.trim()||!senderName.trim()||!file){setMessage('Enter the sender details and upload the payment receipt.');return}
  setBusy(true);
  try{
   const p=await fetch('/api/payments/receipt-upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:file.name,type:file.type,size:file.size})});
   const pj=await p.json();if(!p.ok)throw new Error(pj.error||'Could not prepare receipt upload.');
   await new Promise<void>((resolve,reject)=>{const xhr=new XMLHttpRequest();xhr.open('PUT',pj.uploadUrl);xhr.setRequestHeader('Content-Type',file.type);xhr.onload=()=>xhr.status>=200&&xhr.status<300?resolve():reject(new Error('Receipt upload failed ('+xhr.status+').'));xhr.onerror=()=>reject(new Error('Receipt upload failed.'));xhr.send(file)});
   const r=await fetch('/api/payments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,targetType,senderPhone,senderName,transactionReference:reference,receiptKey:pj.key,couponCode:coupon})});
   const j=await r.json();if(!r.ok)throw new Error(j.error||'Could not submit request.');
   window.location.assign('/dashboard/payments?submitted=1');
  }catch(e:any){setMessage(e.message||'Could not submit payment request.');setBusy(false)}
 };
 const backHref=targetType==='path'?'/paths/'+slug:'/courses/'+slug;
 if(loading)return <main><div className="shell"><SiteNav/><section className="section">Loading payment details…</section></div></main>;
 if(error)return <main><div className="shell"><SiteNav/><section className="section"><div className="error">{error}</div><Link className="btn" href={backHref}>Back to {targetType}</Link></section></div></main>;
 return <main><div className="shell"><SiteNav/><section className="section" style={{maxWidth:760,margin:'0 auto'}}>
  <div className="eyebrow">Secure manual checkout</div><h1 style={{fontFamily:'Space Grotesk',fontSize:'clamp(38px,6vw,58px)',letterSpacing:'-.04em'}}>Complete your payment.</h1>
  <p className="muted">Transfer through InstaPay, then submit your receipt. {targetType==='path'?'Path':'Course'} access is activated only after the academy verifies the transfer.</p>
  {data?.pending&&<div className="card"><h3>Request already pending</h3><p className="muted">You have already submitted a request for this {targetType}. Track its status from your dashboard.</p><Link className="btn primary" href="/dashboard/payments">Track request</Link></div>}
  {!data?.pending&&<><div className="card" style={{marginTop:20}}><div className="eyebrow">Order summary · {targetType==='path'?'Learning path':'Course'}</div><h2>{data.target.title}</h2><p className="muted">Original price: {Number(data.originalPrice).toFixed(2)} EGP</p>{Number(data.discountAmount)>0&&<p>Discount {data.coupon?.code?'('+data.coupon.code+')':''}: <b>{Number(data.discountAmount).toFixed(2)} EGP</b></p>}<h2 style={{margin:'8px 0'}}>Amount to transfer: {Number(data.finalPrice).toFixed(2)} EGP</h2></div>
  <div className="card" style={{marginTop:14}}><div className="eyebrow">InstaPay transfer details</div>{!data.settings?.instapay_address?<p className="muted">The academy has not configured its InstaPay details yet. Please try again later.</p>:<><p className="small muted">Account holder</p><h3>{data.settings.account_name}</h3><p className="small muted">InstaPay address / number</p><div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}><code style={{fontSize:18,wordBreak:'break-all'}}>{data.settings.instapay_address}</code><button className="btn" onClick={copy}>Copy details</button></div><p className="muted" style={{whiteSpace:'pre-wrap',lineHeight:1.8,marginTop:14}}>{data.settings.instructions}</p></>}</div>
  {data.settings?.instapay_address&&<div className="card" style={{marginTop:14}}><div className="eyebrow">Transfer confirmation</div><div className="field"><label>Sender InstaPay phone number</label><input value={senderPhone} onChange={e=>setSenderPhone(e.target.value)} inputMode="tel" placeholder="01xxxxxxxxx"/></div><div className="field"><label>Sender account holder name</label><input value={senderName} onChange={e=>setSenderName(e.target.value)} placeholder="Name shown in the transfer"/></div><div className="field"><label>Transaction reference (optional)</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Reference / transaction ID"/></div><div className="field"><label>Payment receipt (JPG, PNG, WebP or PDF · max 10 MB)</label><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e=>setFile(e.target.files?.[0]||null)}/>{file&&<span className="small muted">{file.name} · {(file.size/1024/1024).toFixed(2)} MB</span>}</div><p className="small muted">Submitting creates a pending request only. A screenshot is not proof of payment; the academy verifies the actual transfer before approving access.</p>{message&&<p className="small" role="status">{message}</p>}<button className="btn primary" style={{width:'100%',justifyContent:'center'}} disabled={busy} onClick={submit}>{busy?'Uploading and submitting…':'I have transferred — submit receipt'}</button></div>}</>}
 </section></div></main>;
}
