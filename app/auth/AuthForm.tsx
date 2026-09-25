'use client';
import {FormEvent,useState} from 'react';
import Link from 'next/link';

export function AuthForm({mode}:{mode:'login'|'register'}){
 const [error,setError]=useState(''),[busy,setBusy]=useState(false),[showPassword,setShowPassword]=useState(false),[password,setPassword]=useState('');

 const submit=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();setBusy(true);setError('');
  const form=new FormData(e.currentTarget);
  const payload=mode==='login'?{email:String(form.get('login')||''),password:String(form.get('password')||'')}:Object.fromEntries(form.entries());
  try{
   const res=await fetch(`/api/auth/${mode}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   const json=await res.json();
   if(!res.ok){setError(json.error||'Something went wrong.');return}
   const next=new URLSearchParams(location.search).get('next');location.href=next||'/'
  }catch{setError('Unable to connect to the server.')}finally{setBusy(false)}
 };

 const passwordRules=[
  {label:'At least 8 characters',valid:password.length>=8},
  {label:'At least one uppercase letter (A–Z)',valid:/[A-Z]/.test(password)},
  {label:'At least one number (0–9)',valid:/[0-9]/.test(password)},
  {label:'At least one special character (e.g. _ or @)',valid:/[^A-Za-z0-9]/.test(password)}
 ];

 return <div className="form">
  <Link className="brand" href="/">Marwan <span>Swedan</span></Link>
  <div className="eyebrow" style={{marginTop:30}}>Private Academy</div>
  <h1>{mode==='login'?'Welcome back.':'Create your account.'}</h1>
  <p className="muted">{mode==='login'?'Sign in with your email or username and password.':'Create one account for the academy, courses and your profile.'}</p>
  {error&&<div className="error">{error}</div>}
  <form onSubmit={submit}>
   {mode==='register'&&<>
    <div className="field"><label>Full name</label><input required minLength={2} maxLength={80} name="name" autoComplete="name"/></div>
    <div className="field"><label>Email</label><input required type="email" name="email" autoComplete="email"/></div>
    <div className="field"><label>WhatsApp number</label><input required inputMode="tel" name="whatsapp" placeholder="2015…"/></div>
    <div className="field"><label>Username</label><input required name="username" pattern="[A-Za-z0-9_]{3,24}" title="Use 3–24 letters, numbers, or underscores." autoComplete="username"/><span className="small muted">3–24 letters, numbers or underscores.</span></div>
   </>}
   <div className="field">
    <label>{mode==='login'?'Email or username':'Password'}</label>
    {mode==='login'
      ?<input required name="login" autoComplete="username"/>
      :<div>
        <div style={{display:'flex',gap:8}}>
         <input style={{flex:1}} required minLength={8} name="password" autoComplete="new-password" type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)}/>
         <button className="btn" type="button" onClick={()=>setShowPassword(!showPassword)}>{showPassword?'Hide':'Show'}</button>
        </div>
        <div className="passwordRules" aria-live="polite">
         {passwordRules.map(rule=><div key={rule.label} className={`passwordRule ${rule.valid?'valid':''}`}><span className="passwordRuleIcon">{rule.valid?'✓':'○'}</span><span>{rule.label}</span></div>)}
        </div>
       </div>}
   </div>
   {mode==='login'&&<div className="field"><label>Password</label><div style={{display:'flex',gap:8}}><input style={{flex:1}} required name="password" autoComplete="current-password" type={showPassword?'text':'password'}/><button className="btn" type="button" onClick={()=>setShowPassword(!showPassword)}>{showPassword?'Hide':'Show'}</button></div></div>}
   <button className="btn primary" style={{width:'100%',marginTop:10}} disabled={busy}>{busy?'Please wait…':mode==='login'?'Sign in':'Create account'}</button>
  </form>
  <p className="small muted">{mode==='login'?<>No account? <Link href="/register">Register</Link> · <Link href="/forgot-password">Forgot password?</Link></>:<>Already registered? <Link href="/login">Sign in</Link></>}</p>
  <p className="small muted">Email/username authentication only. Your browser can offer to save the password.</p>
 </div>;
}
