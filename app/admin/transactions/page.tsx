'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
const egp=(n:any)=>Number(n||0).toLocaleString('en-EG',{minimumFractionDigits:2,maximumFractionDigits:2})+' EGP';
export default function AdminTransactions(){
 const [rows,setRows]=useState<any[]>([]),[summary,setSummary]=useState<any>({}),[monthly,setMonthly]=useState<any[]>([]),[courses,setCourses]=useState<any[]>([]);
 const [courseId,setCourseId]=useState(''),[from,setFrom]=useState(''),[to,setTo]=useState(''),[status,setStatus]=useState('all'),[message,setMessage]=useState('');
 const [settings,setSettings]=useState<any>({instapayAddress:'',accountName:'',instructions:''}),[saving,setSaving]=useState(false),[busy,setBusy]=useState(''),[declineId,setDeclineId]=useState(''),[reason,setReason]=useState('');
 async function load(){
  const qs=new URLSearchParams({courseId,from,to,status});
  const results=await Promise.all([fetch('/api/admin/payments?'+qs),fetch('/api/admin/payments/settings'),fetch('/api/admin/courses')]);
  const j=await results[0].json(),s=await results[1].json(),c=await results[2].json();
  if(!results[0].ok)throw new Error(j.error||'Could not load transactions.');
  setRows(j.requests||[]);setSummary(j.summary||{});setMonthly(j.monthly||[]);setCourses(c.courses||[]);
  setSettings({instapayAddress:s.settings?.instapay_address||'',accountName:s.settings?.account_name||'',instructions:s.settings?.instructions||''});
 }
 useEffect(()=>{load().catch(e=>setMessage(e.message))},[]);
 async function review(id:string,action:string){
  if(action==='decline'&&!reason.trim()){setMessage('Enter a decline reason.');return}
  if(action==='approve'&&!confirm('Confirm the transfer is visible in InstaPay and the exact amount has arrived?'))return;
  setBusy(id);setMessage('');
  try{const r=await fetch('/api/admin/payments',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,action,reason})});const j=await r.json();if(!r.ok)throw new Error(j.error||'Could not review request.');setDeclineId('');setReason('');await load();setMessage(action==='approve'?'Payment approved and course access activated.':'Payment request declined.')}
  catch(e:any){setMessage(e.message)}finally{setBusy('')}
 }
 async function receipt(id:string){const tab=window.open('about:blank','_blank');try{const r=await fetch('/api/admin/payments/receipt/'+id),j=await r.json();if(!r.ok)throw new Error(j.error||'Could not open receipt.');if(tab)tab.location.href=j.url;else window.location.href=j.url}catch(e:any){tab?.close();setMessage(e.message||'Could not open receipt.')}}
 async function saveSettings(){
  setSaving(true);setMessage('');
  try{const r=await fetch('/api/admin/payments/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(settings)});const j=await r.json();if(!r.ok)throw new Error(j.error||'Could not save settings.');setMessage('InstaPay settings saved.')}
  catch(e:any){setMessage(e.message)}finally{setSaving(false)}
 }
 function exportCsv(){
  const headers=['Student','Username','Course','Amount EGP','Status','Sender phone','Sender name','Transaction reference','Coupon','Submitted at','Reviewed at','Decline reason'];
  const q=(v:any)=>{let value=String(v??'');if(/^[=+@-]/.test(value))value="'"+value;return '"'+value.replace(/"/g,'""')+'"'};
  const csv=[headers.map(q).join(','),...rows.map(r=>[r.student_name,r.username,r.course_title,r.amount,r.status,r.sender_phone,r.sender_name,r.transaction_reference,r.coupon_code,r.created_at,r.reviewed_at,r.decline_reason].map(q).join(','))].join('\r\n');
  const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='academy-payment-transactions.csv';a.click();URL.revokeObjectURL(url);
 }
 return <main><div className="shell"><section className="section">
  <div className="actions" style={{justifyContent:'space-between'}}><div><div className="eyebrow">Admin finance</div><h1 style={{fontFamily:'Space Grotesk',fontSize:'clamp(38px,6vw,60px)'}}>Transactions.</h1></div><Link className="btn" href="/admin">Back to admin</Link></div>
  {message&&<p className="small" role="status">{message}</p>}
  <div className="grid" style={{marginTop:20}}>
   <article className="card"><div className="eyebrow">Approved revenue</div><h2>{egp(summary.revenue)}</h2><p className="small muted">Approved transfers only.</p></article>
   <article className="card"><div className="eyebrow">Pending</div><h2>{summary.pending||0}</h2></article>
   <article className="card"><div className="eyebrow">Approved</div><h2>{summary.approved||0}</h2></article>
   <article className="card"><div className="eyebrow">Declined</div><h2>{summary.declined||0}</h2></article>
  </div>
  <div className="card" style={{marginTop:16}}><div className="eyebrow">Payment configuration</div><h3>InstaPay account details</h3>
   <div className="field"><label>InstaPay address / number</label><input value={settings.instapayAddress} onChange={e=>setSettings({...settings,instapayAddress:e.target.value})}/></div>
   <div className="field"><label>Account holder name</label><input value={settings.accountName} onChange={e=>setSettings({...settings,accountName:e.target.value})}/></div>
   <div className="field"><label>Transfer instructions</label><textarea value={settings.instructions} onChange={e=>setSettings({...settings,instructions:e.target.value})}/></div>
   <button className="btn primary" onClick={saveSettings} disabled={saving}>{saving?'Saving…':'Save InstaPay details'}</button>
  </div>
  <div className="card" style={{marginTop:16}}><div className="eyebrow">Reports</div><h3>Monthly approved revenue</h3>
   {monthly.length?monthly.map(m=><div key={m.month} style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid var(--line)'}}><span>{m.month}</span><span>{egp(m.revenue)} · {m.approved_count} approved · {m.declined_count} declined · {m.pending_count} pending</span></div>):<p className="muted">No approved revenue in the last 12 months.</p>}
  </div>
  <div className="card" style={{marginTop:16}}><div className="cardHead"><div><div className="eyebrow">Payment queue</div><h3>Student requests</h3></div><button className="btn" onClick={exportCsv}>Export CSV</button></div>
   <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))'}}>
    <div className="field"><label>Course</label><select value={courseId} onChange={e=>setCourseId(e.target.value)}><option value="">All courses</option>{courses.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
    <div className="field"><label>From</label><input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></div>
    <div className="field"><label>To</label><input type="date" value={to} onChange={e=>setTo(e.target.value)}/></div>
    <div className="field"><label>Status</label><select value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="declined">Declined</option></select></div>
   </div>
   <button className="btn" onClick={()=>load().catch(e=>setMessage(e.message))}>Apply filters</button>
   {!rows.length?<p className="muted">No requests match these filters.</p>:<div style={{display:'grid',gap:12,marginTop:14}}>{rows.map(r=><article className="card" key={r.id} style={{background:'rgba(255,255,255,.02)'}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><div><span className="tag">{r.status}</span><h3>{r.student_name} · {r.course_title}</h3><p className="small muted">@{r.username} · submitted {new Date(r.created_at).toLocaleString()}</p></div><h3>{egp(r.amount)}</h3></div>
    <p className="small">Sender: {r.sender_name} · {r.sender_phone}</p><p className="small muted">Reference: {r.transaction_reference||'Not provided'} · Coupon: {r.coupon_code||'None'}</p>
    <div className="actions"><button className="btn" onClick={()=>receipt(r.id)}>View private receipt</button></div>
    {r.status==='pending'?<><div className="actions"><button className="btn primary" disabled={busy===r.id} onClick={()=>review(r.id,'approve')}>Verify transfer & approve</button><button className="btn" disabled={busy===r.id} onClick={()=>setDeclineId(declineId===r.id?'':r.id)}>Decline</button></div>{declineId===r.id&&<div className="field"><label>Reason for declining</label><textarea value={reason} onChange={e=>setReason(e.target.value)}/><button className="btn" onClick={()=>review(r.id,'decline')} disabled={busy===r.id}>Confirm decline</button></div>}</>:<p className="small muted">{r.status==='approved'?'Approved':'Declined'} · {r.reviewed_at?new Date(r.reviewed_at).toLocaleString():''}{r.decline_reason?' · '+r.decline_reason:''}</p>}
   </article>)}</div>}
  </div>
 </section></div></main>;
}
