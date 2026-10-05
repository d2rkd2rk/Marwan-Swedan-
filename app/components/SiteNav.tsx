'use client';

import Link from 'next/link';
import {useEffect,useState} from 'react';
import s from '../home.module.css';

type NavUser={username:string;role:string}|null;

export default function SiteNav({initialUser=null}:{initialUser?:NavUser}){
 const [user,setUser]=useState<NavUser>(initialUser);
 const [busy,setBusy]=useState(false);
 const [menuOpen,setMenuOpen]=useState(false);
 useEffect(()=>{
  fetch('/api/auth/me',{cache:'no-store'}).then(r=>r.json()).then(data=>setUser(data.user||null)).catch(()=>{});
 },[]);
 const logout=async()=>{
  if(busy)return;
  setBusy(true);
  try{await fetch('/api/auth/logout',{method:'POST'});}finally{window.location.href='/';}
 };
 const closeMenu=()=>setMenuOpen(false);
 return <nav className={s.nav}>
  <Link href="/" className={s.logo} onClick={closeMenu}><span className={s.logoMark} aria-hidden="true" style={{clipPath:'none',borderRadius:'50%',backgroundImage:"url('/images/profile.jpg')",backgroundSize:'cover',backgroundPosition:'center',fontSize:0}}/><span className={s.logoText}>Marwan Swedan<small>Cybersecurity · Academy · Portfolio</small></span></Link>
  <div className={s.links}>
   <Link href="/">Home</Link><Link href="/courses">Academy</Link><Link href="/courses">Courses</Link><Link href="/paths">Paths</Link><Link href="/#portfolio">Portfolio</Link>
  </div>
  <div className={s.mobileMenu}>
   <button type="button" className={s.mobileMenuToggle} aria-label={menuOpen?'Close navigation menu':'Open navigation menu'} aria-expanded={menuOpen} onClick={()=>setMenuOpen(v=>!v)}>
    <span></span><span></span><span></span>
   </button>
   {menuOpen&&<div className={s.mobileMenuPanel}>
    <Link href="/" onClick={closeMenu}>Home</Link><Link href="/courses" onClick={closeMenu}>Academy</Link><Link href="/courses" onClick={closeMenu}>Courses</Link><Link href="/paths" onClick={closeMenu}>Paths</Link><Link href="/#portfolio" onClick={closeMenu}>Portfolio</Link>
    {user&&<><Link href="/dashboard" onClick={closeMenu}>Dashboard</Link><Link href="/account" onClick={closeMenu}>@{user.username}</Link>{user.role==='admin'&&<Link href="/admin" onClick={closeMenu}>Admin Dashboard</Link></>}
    {!user&&<><Link href="/login" onClick={closeMenu}>Login</Link><Link href="/register" onClick={closeMenu}>Get Started</Link></>}
    {user&&<button type="button" className={s.mobileSignOut} onClick={logout} disabled={busy}>{busy?'Signing out…':'Sign out'}</button>}
   </div>}
  </div>
  <div className={s.navActions}>
   <span className={s.search}>⌕</span>
   {user ? <>{user.role!=='admin'&&<Link className={s.btn} href="/dashboard">Dashboard</Link>}<Link className={s.btn} href="/account">@{user.username}</Link>{user.role==='admin'&&<Link className={s.btn+' '+s.primary} href="/admin">Dashboard</Link>}<button className={s.btn} onClick={logout} disabled={busy}>{busy?'Signing out…':'Sign out'}</button></> : <><Link className={s.btn} href="/login">Login</Link><Link className={s.btn+' '+s.primary} href="/register">Get Started</Link></>}
  </div>
 </nav>;
}
