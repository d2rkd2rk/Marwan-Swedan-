'use client';

import {useEffect,useState} from 'react';

type BeforeInstallPromptEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};
const COMPLETED_KEY='msa_pwa_prompt_completed';

export default function PWAInstallPrompt(){
 const [installEvent,setInstallEvent]=useState<BeforeInstallPromptEvent|null>(null);
 const [show,setShow]=useState(false);
 const [ios,setIos]=useState(false);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');

 useEffect(()=>{
  let cancelled=false;
  const syncExistingSubscription=async()=>{
   if(!('Notification' in window)||Notification.permission!=='granted'||!('serviceWorker' in navigator)||!('PushManager' in window))return;
   try{
    const reg=await navigator.serviceWorker.ready;
    const sub=await reg.pushManager.getSubscription();
    if(!sub||cancelled)return;
    await fetch('/api/push/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(sub.toJSON())});
   }catch{}
  };
  if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').then(()=>syncExistingSubscription()).catch(()=>{});
  const standalone=window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone===true;
  if(standalone||localStorage.getItem(COMPLETED_KEY)==='1')return()=>{cancelled=true};

  const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
  setIos(isIOS);

  if('Notification' in window && Notification.permission==='granted'){
   localStorage.setItem(COMPLETED_KEY,'1');
   return()=>{cancelled=true};
  }

  const handler=(e:Event)=>{
   e.preventDefault();
   setInstallEvent(e as BeforeInstallPromptEvent);
   setShow(true);
  };
  window.addEventListener('beforeinstallprompt',handler);
  const timer=window.setTimeout(()=>setShow(true),900);
  const installed=()=>{localStorage.setItem(COMPLETED_KEY,'1');setShow(false);setInstallEvent(null)};
  window.addEventListener('appinstalled',installed);

  return()=>{
   cancelled=true;
   window.removeEventListener('beforeinstallprompt',handler);
   window.removeEventListener('appinstalled',installed);
   window.clearTimeout(timer);
  };
 },[]);;

 const complete=()=>{localStorage.setItem(COMPLETED_KEY,'1');setShow(false);setInstallEvent(null)};

 const install=async()=>{
  if(!installEvent)return;
  setBusy(true);
  try{
   await installEvent.prompt();
   const choice=await installEvent.userChoice;
   if(choice.outcome==='accepted')complete();
  }catch{}finally{setBusy(false);setInstallEvent(null)}
 };

 const enableNotifications=async()=>{
  setBusy(true);
  setMessage('');
  try{
   if(!('Notification' in window)||!('PushManager' in window)){
    setMessage('Notifications are not supported by this browser.');
    return;
   }
   const permission=Notification.permission==='granted'? 'granted':await Notification.requestPermission();
   if(permission!=='granted'){
    setMessage('Notifications were not enabled.');
    return;
   }
   const reg=await navigator.serviceWorker.ready;
   const config=await fetch('/api/push/config',{cache:'no-store'}).then(r=>r.json());
   if(!config.publicKey)throw new Error('Notifications are not configured yet.');
   let sub=await reg.pushManager.getSubscription();
   if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:config.publicKey});
   const response=await fetch('/api/push/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(sub.toJSON())});
   if(!response.ok)throw new Error('Could not enable notifications.');
   complete();
  }catch(error){
   setMessage(error instanceof Error?error.message:'Could not enable notifications.');
  }finally{setBusy(false)}
 };

 if(!show)return null;

 return <div className="pwaInstallOverlay">
  <div className="pwaInstallCard" role="dialog" aria-modal="true" aria-label="Marwan Swedan Academy">
   <div className="pwaInstallIcon">MS</div>
   <div className="pwaInstallCopy">
    <div className="eyebrow">Marwan Swedan Academy</div>
    <h3>Install the Academy</h3>
    <p>Install the platform on your device for quick access, or enable browser notifications for new course updates.</p>
    {ios&&<p className="pwaInstallHint">On iPhone/iPad: tap <b>Share</b>, then <b>Add to Home Screen</b>.</p>}
    {message&&<p className="pwaInstallHint">{message}</p>}
   </div>
   <div className="pwaInstallActions">
    {installEvent&&<button className="btn primary" onClick={install} disabled={busy}>{busy?'Installing…':'Install App'}</button>}
    {!ios&&<button className="btn" onClick={enableNotifications} disabled={busy}>{busy?'Enabling…':'Enable Notifications'}</button>}
    {ios&&!installEvent&&<button className="btn primary" onClick={complete}>Got it</button>}
    <button className="btn" onClick={()=>setShow(false)}>Not now</button>
   </div>
  </div>
 </div>;
}
