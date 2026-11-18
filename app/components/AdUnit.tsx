'use client';

import {useEffect, useRef, useState} from 'react';

declare global {
 interface Window {
  adsbygoogle?: unknown[];
 }
}

export default function AdUnit({slot}:{slot:string}) {
 const pushed=useRef(false);
 const [allowed,setAllowed]=useState(false);
 useEffect(()=>{const check=()=>{try{setAllowed(localStorage.getItem('provenra_cookie_consent_v1')==='all')}catch{setAllowed(false)}};check();window.addEventListener('provenra:ads-consent',check);return()=>window.removeEventListener('provenra:ads-consent',check)},[]);
 useEffect(()=>{if(!allowed||pushed.current)return;pushed.current=true;try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}catch{pushed.current=false}},[allowed]);
 if(!allowed)return null;
 return <div style={{width:'100%',maxWidth:'360px',minHeight:'90px',margin:'28px auto',padding:'0 12px',display:'flex',justifyContent:'center',alignItems:'center',overflow:'hidden'}}>
  <ins className="adsbygoogle" style={{display:'block',width:'100%'}} data-ad-client="ca-pub-5071824712430151" data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" />
 </div>;
}
