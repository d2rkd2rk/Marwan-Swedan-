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
  <Link href="/" className={s.logo} onClick={closeMenu}><span className={s.logoMark} aria-hidden="true" style={{clipPath:'none',borderRadius:'10px',backgroundImage:"url('/images/marwan-app-icon.svg')",backgroundSize:'cover',backgroundPosition:'center',fontSize:0}}/><span className={s.logoText}>PROVENRA<small>Cybersecurity · Digital Forensics</small></span></Link>
  <div className={s.links}>
   <Link href="/">Home</Link><Link href="/courses">Courses</Link><Link href="/paths">Learning Paths</Link>
   <details className="siteNavMore"><summary>Explore +</summary><div className="siteNavDropdown">
    <b>Main</b><Link href="/#portfolio">Portfolio</Link><Link href="/about">About Marwan</Link><Link href="/about-us">About PROVENRA</Link>
    <b>Information</b><Link href="/about-us#terms">Terms of Service</Link><Link href="/about-us#privacy">Privacy Policy</Link><Link href="/cookie-policy">Cookie Policy</Link>
    <b>Support</b><Link href="/about-us#contact">Contact & Support</Link>
   </div></details>
  </div>
  <div className={s.mobileMenu}>
   <button type="button" className={s.mobileMenuToggle} aria-label={menuOpen?'Close navigation menu':'Open navigation menu'} aria-expanded={menuOpen} onClick={()=>setMenuOpen(v=>!v)}>
    <span></span><span></span><span></span>
   </button>
   {menuOpen&&<div className={s.mobileMenuPanel}>
    <details className="mobileNavGroup"><summary>Main <span>+</span></summary><Link href="/" onClick={closeMenu}>Home</Link><Link href="/#portfolio" onClick={closeMenu}>Portfolio</Link><Link href="/about" onClick={closeMenu}>About Marwan</Link><Link href="/about-us" onClick={closeMenu}>About PROVENRA</Link></details>
    <details className="mobileNavGroup"><summary>Academy <span>+</span></summary><Link href="/courses" onClick={closeMenu}>Courses</Link><Link href="/paths" onClick={closeMenu}>Learning Paths</Link></details>
    <details className="mobileNavGroup"><summary>Information & Support <span>+</span></summary><Link href="/about-us#terms" onClick={closeMenu}>Terms of Service</Link><Link href="/about-us#privacy" onClick={closeMenu}>Privacy Policy</Link><Link href="/cookie-policy" onClick={closeMenu}>Cookie Policy</Link><Link href="/about-us#contact" onClick={closeMenu}>Contact & Support</Link></details>
    {user&&<details className="mobileNavGroup"><summary>{user.role==='instructor'?'Instructor':'My Account'} <span>+</span></summary>{user.role==='instructor'?<Link href="/instructor" onClick={closeMenu}>Upload Videos</Link>:<><Link href="/dashboard" onClick={closeMenu}>Dashboard</Link><Link href="/dashboard/payments" onClick={closeMenu}>Payment History</Link><Link href="/account" onClick={closeMenu}>@{user.username}</Link>{user.role==='admin'&&<><Link href="/admin" onClick={closeMenu}>Admin Dashboard</Link><Link href="/admin/transactions" onClick={closeMenu}>Transactions</Link><Link href="/admin/coupons" onClick={closeMenu}>Coupons</Link><Link href="/admin/paths" onClick={closeMenu}>Manage Paths</Link><Link href="/admin/instructors" onClick={closeMenu}>Instructors</Link></>}</>}</details>}
    {!user&&<><Link href="/login" onClick={closeMenu}>Login</Link><Link href="/register" onClick={closeMenu}>Get Started</Link></>}
    {user&&<button type="button" className={s.mobileSignOut} onClick={logout} disabled={busy}>{busy?'Signing out…':'Sign out'}</button>}
   </div>}
  </div>
  <div className={s.navActions}>
   <span className={s.search}>⌕</span>
   {user ? <>{user.role==='instructor'?<Link className={s.btn+' '+s.primary} href="/instructor">Upload videos</Link>:<>{user.role!=='admin'&&<Link className={s.btn} href="/dashboard">Dashboard</Link>}<Link className={s.btn} href="/account">@{user.username}</Link>{user.role==='admin'&&<Link className={s.btn+' '+s.primary} href="/admin">Dashboard</Link>}</>}<button className={s.btn} onClick={logout} disabled={busy}>{busy?'Signing out…':'Sign out'}</button></> : <><Link className={s.btn} href="/login">Login</Link><Link className={s.btn+' '+s.primary} href="/register">Get Started</Link></>}
  </div>
 </nav>;
}
