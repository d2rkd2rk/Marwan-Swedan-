'use client';
import {FormEvent,useState} from 'react';
import Link from 'next/link';

export function AuthForm({mode}:{mode:'login'|'register'}){
 const [error,setError]=useState(''),[busy,setBusy]=useState(false),[showPassword,setShowPassword]=useState(false),[password,setPassword]=useState(''),[verificationEmail,setVerificationEmail]=useState(''),[verificationMessage,setVerificationMessage]=useState('');
 const [resendBusy,setResendBusy]=useState(false);

 const submit=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();setBusy(true);setError('');setVerificationMessage('');
  const form=new FormData(e.currentTarget);
  const payload=mode==='login'?{login:String(form.get('login')||''),password:String(form.get('password')||'')}:Object.fromEntries(form.entries());
  try{
   const res=await fetch(`/api/auth/${mode}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   const json=await res.json();
   if(!res.ok){setError(json.error||'Something went wrong.');return}
   if(mode==='register'&&json.registered){
    setVerificationEmail(String(json.email||payload.email||''));
    setVerificationMessage(json.emailSent?'Account created. Check your inbox and click the verification link before signing in.':'Your account was created, but the verification email could not be sent yet. Use the resend button below after email setup is complete.');
    return;
   }
   const next=new URLSearchParams(location.search).get('next');location.href=next||'/'
  }catch{setError('Unable to connect to the server.')}finally{setBusy(false)}
 };

 const resend=async()=>{
  if(!verificationEmail)return;
  setResendBusy(true);setError('');
  try{
   const res=await fetch('/api/auth/resend-verification',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:verificationEmail})});
   const json=await res.json();
   if(!res.ok){setError(json.error||'Unable to resend the verification email.');return}
   setVerificationMessage(json.message||'If the account needs verification, an email will be sent shortly. Check your inbox and spam folder.');
  }catch{setError('Unable to connect to the server.')}finally{setResendBusy(false)}
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
  <h1>{verificationEmail?'Check your email':mode==='login'?'Welcome back.':'Create your account.'}</h1>
  <p className="muted">{verificationEmail?'Verify your email address to activate your academy account.':mode==='login'?'Sign in with your email or username and password.':'Create one account for the academy, courses and your profile.'}</p>
  {error&&<div className="error">{error}</div>}
  {verificationMessage&&<div className="success" role="status">{verificationMessage}</div>}
  {verificationEmail? <div className="field">
   <button className="btn primary" style={{width:'100%'}} disabled={resendBusy} onClick={resend} type="button">{resendBusy?'Please wait…':'Resend verification email'}</button>
   <p className="small muted">Check your spam folder too. The link expires after 24 hours and can only be used once.</p>
   <p className="small muted"><Link href="/login">Return to sign in</Link></p>
  </div>:<form onSubmit={submit}>
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
  </form>}
  {!verificationEmail&&<p className="small muted">{mode==='login'?<>No account? <Link className="registerCta" href="/register">Register</Link> · <Link href="/forgot-password">Forgot password?</Link></>:<>Already registered? <Link href="/login">Sign in</Link></>}</p>}
  <p className="small muted">Email/username authentication only. Your browser can offer to save the password.</p>
 </div>;
}
