'use client';

import {useEffect,useState} from 'react';
import {usePathname,useRouter} from 'next/navigation';

const publicPaths=['/login','/register','/forgot-password','/reset-password'];

export default function AuthGate({children}:{children:React.ReactNode}){
  const pathname=usePathname();
  const router=useRouter();
  const [ready,setReady]=useState(publicPaths.includes(pathname));

  useEffect(()=>{
    if(publicPaths.includes(pathname)){setReady(true);return;}
    let cancelled=false;
    fetch('/api/auth/me',{cache:'no-store'}).then(r=>r.json()).then(data=>{
      if(cancelled)return;
      if(!data.user){router.replace('/login');return;}
      setReady(true);
    }).catch(()=>router.replace('/login'));
    return()=>{cancelled=true};
  },[pathname,router]);

  if(!ready)return <main className="authGate"><div className="gateCard"><div className="brand">MARWAN<span>.SWEDAN</span></div><div className="gatePulse"/><p>Checking your secure session…</p></div></main>;
  return <>{children}</>;
}
