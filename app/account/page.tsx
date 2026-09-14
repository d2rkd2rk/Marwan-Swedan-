'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';

type User={name:string;email:string;whatsapp:string;username:string;role:string;bio:string;avatar_url:string;cv_url:string;cv_name:string};

async function upload(file:File,kind:'avatar'|'cv'){
  const prep=await fetch('/api/account/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,name:file.name,type:file.type,size:file.size})});
  const data=await prep.json();
  if(!prep.ok)throw new Error(data.error||'Upload failed.');
  const put=await fetch(data.uploadUrl,{method:'PUT',headers:{'Content-Type':file.type},body:file});
  if(!put.ok)throw new Error('Upload failed.');
  return data.url as string;
}

export default function AccountPage(){
  const [user,setUser]=useState<User|null>(null);
  const [form,setForm]=useState({name:'',username:'',bio:''});
  const [currentPassword,setCurrentPassword]=useState('');
  const [newPassword,setNewPassword]=useState('');
  const [showCurrent,setShowCurrent]=useState(false);
  const [showNew,setShowNew]=useState(false);
  const [showRegisterStyle,setShowRegisterStyle]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);

  const load=async()=>{const res=await fetch('/api/account');const data=await res.json();if(res.ok){setUser(data.user);setForm({name:data.user.name,username:data.user.username,bio:data.user.bio||''})}else setError(data.error||'Authentication required.')};
  useEffect(()=>{load()},[]);

  const save=async()=>{setBusy(true);setMessage('');setError('');try{const res=await fetch('/api/account',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});const data=await res.json();if(!res.ok)throw new Error(data.error);setUser(data.user);setMessage('Profile saved.')}catch(e:any){setError(e.message||'Could not save profile.')}finally{setBusy(false)}};
  const changePassword=async()=>{setBusy(true);setMessage('');setError('');try{const res=await fetch('/api/account',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({currentPassword,newPassword})});const data=await res.json();if(!res.ok)throw new Error(data.error);setCurrentPassword('');setNewPassword('');setMessage('Password changed successfully.')}catch(e:any){setError(e.message||'Could not change password.')}finally{setBusy(false)}};
  const uploadProfile=async(file:File,kind:'avatar'|'cv')=>{setBusy(true);setMessage('');setError('');try{const url=await upload(file,kind);const body=kind==='avatar'?{...form,avatar_url:url}:{...form,cv_url:url,cv_name:file.name};const res=await fetch('/api/account',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await res.json();if(!res.ok)throw new Error(data.error);setUser(data.user);setMessage(kind==='avatar'?'Profile picture updated.':'CV uploaded successfully.')}catch(e:any){setError(e.message||'Upload failed.')}finally{setBusy(false)}};

  if(!user)return <main className="formwrap"><div className="form"><Link className="brand" href="/">MARWAN.SWEDAN</Link><h1>My account.</h1><p className="muted">{error||'Loading your profile…'}</p></div></main>;
  return <main className="formwrap"><div className="form" style={{width:'min(720px,100%)'}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:20,alignItems:'center'}}><div><Link className="brand" href="/">MARWAN.SWEDAN</Link><h1 style={{marginTop:18}}>My account.</h1></div><Link className="btn" href={user.role==='admin'?'/admin':'/courses'}>{user.role==='admin'?'Admin console':'Courses'}</Link></div>
    {message&&<div className="success" style={{marginTop:15}}>{message}</div>}{error&&<div className="error" style={{marginTop:15}}>{error}</div>}
    <section className="card" style={{marginTop:20}}><div className="cardHead"><h3>Profile</h3></div>
      <div style={{display:'grid',gridTemplateColumns:'120px 1fr',gap:20,alignItems:'start'}}>
        <div style={{textAlign:'center'}}>{user.avatar_url?<img src={user.avatar_url} alt="Profile" style={{width:110,height:110,borderRadius:'50%',objectFit:'cover',border:'1px solid var(--line)'}}/>:<div style={{width:110,height:110,borderRadius:'50%',background:'var(--soft)',display:'grid',placeItems:'center',fontFamily:'Space Grotesk',fontSize:28}}>{user.name.slice(0,1).toUpperCase()}</div>}<label className="btn" style={{marginTop:10,fontSize:11}}>Choose photo<input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const f=e.target.files?.[0];if(f)uploadProfile(f,'avatar')}}/></label></div>
        <div><div className="field"><label>Full name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div><div className="field"><label>Username</label><input pattern="[A-Za-z0-9_]{3,24}" value={form.username} onChange={e=>setForm({...form,username:e.target.value})}/></div><div className="field"><label>Email</label><input value={user.email} disabled/></div><div className="field"><label>WhatsApp</label><input value={user.whatsapp} disabled/></div></div>
      </div>
      <div className="field"><label>Bio</label><textarea maxLength={1000} value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} placeholder="Tell the community about yourself."/></div>
      <button className="btn primary" onClick={save} disabled={busy}>Save profile</button>
    </section>
    <section className="card" style={{marginTop:18}}><div className="cardHead"><h3>CV</h3></div><p className="small muted">Upload your CV as a PDF. It stays protected with your account.</p>{user.cv_url&&<a className="btn" href={user.cv_url} target="_blank">Open {user.cv_name||'CV'}</a>}<label className="btn" style={{marginLeft:8}}>Upload PDF<input className="hidden" type="file" accept="application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)uploadProfile(f,'cv')}}/></label></section>
    <section className="card" style={{marginTop:18}}><div className="cardHead"><h3>Change password</h3></div><div className="field"><label>Current password</label><div style={{display:'flex',gap:8}}><input style={{flex:1}} type={showCurrent?'text':'password'} value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)}/><button className="btn" type="button" onClick={()=>setShowCurrent(!showCurrent)}>{showCurrent?'Hide':'Show'}</button></div></div><div className="field"><label>New password</label><div style={{display:'flex',gap:8}}><input style={{flex:1}} type={showNew?'text':'password'} minLength={8} value={newPassword} onChange={e=>setNewPassword(e.target.value)}/><button className="btn" type="button" onClick={()=>setShowNew(!showNew)}>{showNew?'Hide':'Show'}</button></div><span className="small muted">8+ characters, at least one number and one special character.</span></div><button className="btn primary" onClick={changePassword} disabled={busy||!currentPassword||!newPassword}>Change password</button></section>
    <p className="small muted" style={{marginTop:18}}>Your profile fields are ready for the community layer later, including public profiles, posts and professional connections.</p>
    <Link className="small muted" href="/">Back to portfolio</Link>
  </div></main>;
}
