'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import s from '../home.module.css';
type NavUser={username:string;role:string}|null;
export default function SiteNav({initialUser=null}:{initialUser?:NavUser}){
 const [user,setUser]=useState<NavUser>(initialUser); const [open,setOpen]=useState(false); const [busy,setBusy]=useState(false);
 useEffect(()=>{fetch('/api/auth/me',{cache:'no-store'}).then(r=>r.json()).then(d=>setUser(d.user||null)).catch(()=>{});},[]);
 const logout=async()=>{setBusy(true);try{await fetch('/api/auth/logout',{method:'POST'});}finally{window.location.href='/';}};
 return <nav className={s.header}>
  <Link href="/" className={s.brand}><span className={s.mark}>MS</span><span><b>Marwan Swedan</b><small>Cybersecurity · Academy</small></span></Link>
  <div className={s.headerRight}><button className={s.menuButton} onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-controls="secondary-menu"><span>Menu</span><i className={s.hamburger}><b/><b/><b/></i></button></div>
  {open&&<div className={s.menu} id="secondary-menu" aria-hidden="false" style={{visibility:'visible',opacity:1,pointerEvents:'auto'}}><button className={s.menuBackdrop} onClick={()=>setOpen(false)} aria-label="Close menu"/><div className={s.menuPanel}><div className={s.menuTop}><span>Navigation</span><button onClick={()=>setOpen(false)}>Close <b>×</b></button></div><nav className={s.menuLinks}>
   <Link href="/" onClick={()=>setOpen(false)}><small>01</small><span>Home</span><b>↗</b></Link><Link href="/courses" onClick={()=>setOpen(false)}><small>02</small><span>Academy</span><b>↗</b></Link><Link href="/paths" onClick={()=>setOpen(false)}><small>03</small><span>Learning Paths</span><b>↗</b></Link>{user&&<Link href="/dashboard" onClick={()=>setOpen(false)}><small>04</small><span>Dashboard</span><b>↗</b></Link>}{user?.role==='admin'&&<Link href="/admin" onClick={()=>setOpen(false)}><small>05</small><span>Admin</span><b>↗</b></Link>}{user?<button className={s.secondary} onClick={logout} disabled={busy}><small>06</small><span>{busy?'Signing out…':'Sign out'}</span><b>→</b></button>:<Link href="/login" onClick={()=>setOpen(false)}><small>06</small><span>Login</span><b>↗</b></Link>}</nav></div></div>}
 </nav>;
}