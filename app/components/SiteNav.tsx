'use client';

import Link from 'next/link';
import {useEffect,useState} from 'react';
import s from '../home.module.css';

type NavUser={username:string;role:string}|null;

export default function SiteNav({initialUser=null}:{initialUser?:NavUser}){
 const [user,setUser]=useState<NavUser>(initialUser);
 const [busy,setBusy]=useState(false);
 useEffect(()=>{
  fetch('/api/auth/me',{cache:'no-store'}).then(r=>r.json()).then(data=>setUser(data.user||null)).catch(()=>{});
 },[]);
 const logout=async()=>{
  setBusy(true);
  try{await fetch('/api/auth/logout',{method:'POST'});}finally{window.location.href='/';}
 };
 return <nav className={s.nav}>
  <Link href="/" className={s.logo}><span className={s.logoMark}>M</span><span className={s.logoText}>Marwan Swedan<small>Cybersecurity · Academy · Portfolio</small></span></Link>
  <div className={s.links}>
   <Link href="/">Home</Link>
   <Link href="/courses">Academy</Link>
   <Link href="/courses">Courses</Link>
   <Link href="/#portfolio">Portfolio</Link>
   <Link href="/#about">About</Link>
  </div>
  <div className={s.navActions}>
   <span className={s.search}>⌕</span>
   {user ? <>
    <Link className={s.btn} href="/account">@{user.username}</Link>
    {user.role==='admin'&&<Link className={`${s.btn} ${s.primary}`} href="/admin">Dashboard</Link>}
    <button className={s.btn} onClick={logout} disabled={busy}>{busy?'Signing out…':'Sign out'}</button>
   </> : <>
    <Link className={s.btn} href="/login">Login</Link>
    <Link className={`${s.btn} ${s.primary}`} href="/register">Get Started</Link>
   </>}
  </div>
 </nav>;
}
