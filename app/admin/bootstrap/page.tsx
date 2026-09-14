'use client';
import {FormEvent,useState} from 'react';
import Link from 'next/link';

export default function AdminBootstrapPage(){
  const [secret,setSecret]=useState('');
  const [password,setPassword]=useState('');
  const [showPassword,setShowPassword]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const submit=async(e:FormEvent)=>{
    e.preventDefault();
    setBusy(true);setMessage('');setError('');
    const res=await fetch('/api/auth/bootstrap',{method:'POST',headers:{'Content-Type':'application/json','x-admin-bootstrap-secret':secret},body:JSON.stringify({password})});
    const json=await res.json();
    setBusy(false);
    if(!res.ok){setError(json.error||'Bootstrap failed.');return}
    setMessage('Administrator created. The bootstrap is now permanently closed. You can sign in with the admin email and password.');
    setSecret('');setPassword('');
  };
  return <main className="auth-page"><div className="form"><Link className="brand" href="/">MARWAN.SWEDAN</Link><h1>Administrator setup.</h1><p className="muted">Create the first administrator account once. After success, this bootstrap cannot be used again.</p>{error&&<div className="error">{error}</div>}{message&&<div className="success">{message}</div>}<div className="field"><label>Admin account</label><div className="small muted">Marwan Swedan · marwan_swedan · 202501259@pua.edu.eg</div></div><form onSubmit={submit}><div className="field"><label>Bootstrap secret</label><input required type="password" autoComplete="off" value={secret} onChange={e=>setSecret(e.target.value)}/></div><div className="field"><label>Temporary password</label><div style={{display:'flex',gap:8}}><input style={{flex:1}} required minLength={8} value={password} type={showPassword?'text':'password'} onChange={e=>setPassword(e.target.value)}/><button className="btn" type="button" onClick={()=>setShowPassword(!showPassword)}>{showPassword?'Hide':'Show'}</button></div><span className="small muted">8+ characters, at least one number and one special character.</span></div><button className="btn primary" style={{width:'100%',marginTop:10}} disabled={busy}>{busy?'Creating administrator…':'Create administrator'}</button></form><p className="small muted">Use this page only for the initial administrator setup.</p><Link className="small muted" href="/login">Go to sign in</Link></div></main>}
