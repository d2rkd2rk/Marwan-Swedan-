'use client';

import {useEffect,useState} from 'react';

type BeforeInstallPromptEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};

export default function PWAInstallPrompt(){
 const [installEvent,setInstallEvent]=useState<BeforeInstallPromptEvent|null>(null);
 const [show,setShow]=useState(false);
 const [ios,setIos]=useState(false);
 const [pushReady,setPushReady]=useState(false);
 const [busy,setBusy]=useState(false);

 useEffect(()=>{
  if(window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone===true)return;
  const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
  setIos(isIOS);
  const handler=(e:Event)=>{e.preventDefault();setInstallEvent(e as BeforeInstallPromptEvent);setShow(true)};
  window.addEventListener('beforeinstallprompt',handler);
  const timer=window.setTimeout(()=>setShow(true),700);
  if('serviceWorker' in navigator){
   navigator.serviceWorker.register('/sw.js').then(async reg=>{
    if(!('PushManager' in window))return;
    const config=await fetch('/api/push/config',{cache:'no-store'}).then(r=>r.json()).catch(()=>({}));
    if(!config.publicKey)return;
    const permission=await Notification.requestPermission().catch(()=> 'denied');
    if(permission!=='granted')return;
    let sub=await reg.pushManager.getSubscription();
    if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:config.publicKey});
    const r=await fetch('/api/push/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(sub.toJSON())});
    setPushReady(r.ok);
   }).catch(()=>{});
  }
  return()=>{window.removeEventListener('beforeinstallprompt',handler);window.clearTimeout(timer)};
 },[]);

 const install=async()=>{
  if(!installEvent)return;
  setBusy(true);
  try{await installEvent.prompt();await installEvent.userChoice}catch{}finally{setBusy(false);setShow(false);setInstallEvent(null)}
 };
 if(!show)return null;
 return <div className="pwaInstallOverlay">
  <div className="pwaInstallCard" role="dialog" aria-modal="true" aria-label="Install Marwan Swedan Academy">
   <div className="pwaInstallIcon">MS</div>
   <div className="pwaInstallCopy"><div className="eyebrow">Marwan Swedan Academy</div><h3>Install the Academy</h3><p>Install the platform on your device for quick access and course notifications.</p>{ios&&<p className="pwaInstallHint">On iPhone/iPad: tap <b>Share</b>, then <b>Add to Home Screen</b>.</p>}</div>
   <div className="pwaInstallActions">{installEvent&&<button className="btn primary" onClick={install} disabled={busy}>{busy?'Installing…':'Install App'}</button>}{ios&&!installEvent&&<button className="btn primary" onClick={()=>setShow(false)}>Got it</button>}<button className="btn" onClick={()=>setShow(false)}>Not now</button></div>
   {pushReady&&<small className="pwaInstallStatus">Notifications are enabled for this device.</small>}
  </div>
 </div>;
}