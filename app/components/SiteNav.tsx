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
  <Link href="/" className={s.logo}><span className={s.logoMark} aria-hidden="true" style={{clipPath:'none',borderRadius:'50%',backgroundImage:"url('/images/profile.jpg')",backgroundSize:'cover',backgroundPosition:'center',fontSize:0}}/><span className={s.logoText}>Marwan Swedan<small>Cybersecurity · Academy · Portfolio</small></span></Link>
  <div className={s.links}>
   <Link href="/">Home</Link>
   <Link href="/courses">Academy</Link>
   <Link href="/courses">Courses</Link>
   <Link href="/paths">Paths</Link>
   <Link href="/#portfolio">Portfolio</Link>
   <Link href="/#about">About</Link>
   {user&&<Link href="/dashboard">Dashboard</Link>}
  </div>
  <details className={s.mobileMenu}>
   <summary aria-label="Open navigation menu"><span></span><span></span><span></span></summary>
   <div className={s.mobileMenuPanel}>
    <Link href="/">Home</Link><Link href="/courses">Academy</Link><Link href="/courses">Courses</Link><Link href="/paths">Paths</Link><Link href="/#portfolio">Portfolio</Link><Link href="/#about">About</Link>
    {user&&<><Link href="/dashboard">Dashboard</Link><Link href="/account">@{user.username}</Link>{user.role==='admin'&&<Link href="/admin">Admin Dashboard</Link>}</>}
    {!user&&<><Link href="/login">Login</Link><Link href="/register">Get Started</Link></>}
    {user&&<button className={s.mobileSignOut} onClick={logout} disabled={busy}>{busy?'Signing out…':'Sign out'}</button>}
   </div>
  </details>
  <div className={s.navActions}>
   <span className={s.search}>⌕</span>
   {user ? <>
    {user.role!=='admin'&&<Link className={s.btn} href="/dashboard">Dashboard</Link>}
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
