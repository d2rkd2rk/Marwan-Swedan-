'use client';

import {useState} from 'react';

export default function AdminBootstrap(){
  const [secret,setSecret]=useState('');
  const [url,setUrl]=useState('');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);

  const generate=async()=>{
    setLoading(true);setError('');setUrl('');
    try{
      const r=await fetch('/api/auth/admin-login-link',{method:'POST',headers:{'x-admin-bootstrap-secret':secret}});
      const j=await r.json();
      if(!r.ok)throw new Error(j.error||'Could not generate admin login link.');
      setUrl(j.url||'');
      setSecret('');
    }catch(e:any){setError(e.message||'Could not generate admin login link.')}
    finally{setLoading(false)}
  };

  return <main><div className="shell"><section className="section" style={{maxWidth:620,margin:'10vh auto'}}>
    <div className="eyebrow">Secure administrator access</div>
    <h1>Generate Admin Login Link</h1>
    <p className="muted">Enter your Vercel bootstrap secret. It is sent only over HTTPS to the server and is not saved in the browser or repository.</p>
    <div className="field"><label>Bootstrap secret</label><input type="password" value={secret} autoComplete="off" onChange={e=>setSecret(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')generate()}}/></div>
    <button className="btn primary" disabled={!secret||loading} onClick={generate}>{loading?'Generating…':'Generate Admin Login Link'}</button>
    {error&&<div className="error" style={{marginTop:16}}>{error}</div>}
    {url&&<div className="card" style={{marginTop:20}}><div className="eyebrow">One-time link</div><p className="small muted">Valid for 15 minutes and can be used once. Keep it private.</p><input readOnly value={url} onFocus={e=>e.currentTarget.select()} style={{width:'100%',marginBottom:12}}/><div className="actions"><a className="btn primary" href={url}>Open Admin Login Link</a><button className="btn" onClick={()=>navigator.clipboard?.writeText(url)}>Copy</button></div></div>}
  </section></div></main>;
}
