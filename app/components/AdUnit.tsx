'use client';

import {useEffect, useRef} from 'react';

declare global {
 interface Window {
  adsbygoogle?: unknown[];
 }
}

export default function AdUnit({slot}:{slot:string}) {
 const pushed=useRef(false);
 useEffect(()=>{
  if(pushed.current) return;
  pushed.current=true;
  try {
   (window.adsbygoogle=window.adsbygoogle||[]).push({});
  } catch {
   // AdSense may be unavailable because of consent, an ad blocker, or network restrictions.
  }
 },[]);
 return <div style={{width:'100%',maxWidth:'360px',minHeight:'90px',margin:'28px auto',padding:'0 12px',display:'flex',justifyContent:'center',alignItems:'center',overflow:'hidden'}}>
  <ins className="adsbygoogle" style={{display:'block',width:'100%'}} data-ad-client="ca-pub-5071824712430151" data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" />
 </div>;
}
