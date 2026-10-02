'use client';

import {useEffect,useState} from 'react';

type BeforeInstallPromptEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};
const INSTALL_KEY='msa_pwa_install_required_v2';

export default function PWAInstallPrompt(){
 const [installEvent,setInstallEvent]=useState<BeforeInstallPromptEvent|null>(null);
 const [show,setShow]=useState(false);
 const [ios,setIos]=useState(false);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [loggedIn,setLoggedIn]=useState(false);
 const [authChecked,setAuthChecked]=useState(false);

 useEffect(()=>{
  let cancelled=false;
  const setup=async()=>{
   try{
    const authResponse=await fetch('/api/auth/me',{cache:'no-store'});
    const authData=await authResponse.json();
    const userLoggedIn=Boolean(authData.user);
    if(cancelled)return;
    setLoggedIn(userLoggedIn);
    setAuthChecked(true);

    if('serviceWorker' in navigator){
     const registration=await navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'});
     await registration.update();
    }

    const standalone=window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone===true;
    const installDone=standalone||localStorage.getItem(INSTALL_KEY)==='1';
    const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
    setIos(isIOS);

    if(userLoggedIn){
     if('Notification' in window && 'PushManager' in window){
      const permission=Notification.permission;
      if(permission==='granted'){
       const reg=await navigator.serviceWorker.ready;
       const sub=await reg.pushManager.getSubscription();
       if(sub){
        await fetch('/api/push/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(sub.toJSON())});
        return;
       }
      }
     }
     setShow(true);
     return;
    }

    if(installDone)return;
    const handler=(e:Event)=>{
     e.preventDefault();
     setInstallEvent(e as BeforeInstallPromptEvent);
     setShow(true);
    };
    window.addEventListener('beforeinstallprompt',handler);
    const timer=window.setTimeout(()=>setShow(true),900);
    const installed=()=>{localStorage.setItem(INSTALL_KEY,'1');setShow(false);setInstallEvent(null)};
    window.addEventListener('appinstalled',installed);
    return()=>{
     window.removeEventListener('beforeinstallprompt',handler);
     window.removeEventListener('appinstalled',installed);
     window.clearTimeout(timer);
    };
   }catch{
    if(!cancelled)setAuthChecked(true);
   }
  };
  setup();
  return()=>{cancelled=true};
 },[]);
 const complete=()=>{setShow(false);setInstallEvent(null)};

 const install=async()=>{
  if(!installEvent)return;
  setBusy(true);
  try{
   await installEvent.prompt();
   const choice=await installEvent.userChoice;
   if(choice.outcome==='accepted'){localStorage.setItem(INSTALL_KEY,'1');complete();}
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
  <div className="pwaInstallCard" role="dialog" aria-modal="true" aria-label="Marwan Swedan Academy install and notification prompt">
   <button className="pwaInstallClose" type="button" aria-label="Close" onClick={()=>setShow(false)}>×</button>
   <div className="pwaInstallIcon">MS</div>
   <div className="pwaInstallCopy">
    <div className="eyebrow">Marwan Swedan Academy</div>
    <h3>{loggedIn?'Enable Academy Notifications':'Install the Academy'}</h3>
    <p>{loggedIn?'Allow notifications to receive new lessons and course announcements on your device.':'Install Marwan Swedan Academy on your device for quick access. You can enable notifications after signing in.'}</p>
    {ios&&<p className="pwaInstallHint">On iPhone/iPad: tap <b>Share</b>, then <b>Add to Home Screen</b>.</p>}
    {message&&<p className="pwaInstallHint">{message}</p>}
   </div>
   <div className="pwaInstallActions">
    {!loggedIn&&installEvent&&<button className="btn primary" onClick={install} disabled={busy}>{busy?'Installing…':'Install App'}</button>}
    {loggedIn&&!ios&&<button className="btn primary" onClick={enableNotifications} disabled={busy}>{busy?'Enabling…':'Enable Notifications'}</button>}
    {loggedIn&&ios&&<button className="btn primary" onClick={enableNotifications} disabled={busy}>{busy?'Enabling…':'Enable Notifications'}</button>}
    {ios&&!installEvent&&<button className="btn primary" onClick={complete}>Got it</button>}
   </div>
  </div>
 </div>;
}
