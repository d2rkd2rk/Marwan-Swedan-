'use client';

import {useEffect,useState} from 'react';

type BeforeInstallPromptEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};
type PromptMode='install'|'notifications'|'ios-install'|'ios-unsupported';
const INSTALL_KEY='msa_pwa_install_required_v2';

function isIOSDevice(){
 const ua=navigator.userAgent.toLowerCase();
 return /iphone|ipad|ipod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
}
function supportsIOSWebPush(){
 const match=navigator.userAgent.match(/OS (\d+)[._](\d+)/i);
 if(!match)return true;
 const major=Number(match[1]),minor=Number(match[2]);
 return major>16||(major===16&&minor>=4);
}
function isStandalone(){
 return window.matchMedia('(display-mode: standalone)').matches||(navigator as Navigator&{standalone?:boolean}).standalone===true;
}
function applicationServerKey(value:string):Uint8Array{
 const padded=value+'='.repeat((4-value.length%4)%4);
 const raw=window.atob(padded.replace(/-/g,'+').replace(/_/g,'/'));
 const bytes=new Uint8Array(raw.length);
 for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
 return bytes;
}

export default function PWAInstallPrompt(){
 const [installEvent,setInstallEvent]=useState<BeforeInstallPromptEvent|null>(null);
 const [show,setShow]=useState(false);
 const [ios,setIos]=useState(false);
 const [standalone,setStandalone]=useState(false);
 const [iosPushSupported,setIosPushSupported]=useState(true);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [loggedIn,setLoggedIn]=useState(false);
 const [mode,setMode]=useState<PromptMode>('install');

 useEffect(()=>{
  let cancelled=false;
  let cleanupListeners=()=>{};
  const setup=async()=>{
   try{
    const authResponse=await fetch('/api/auth/me',{cache:'no-store'});
    const authData=await authResponse.json();
    const userLoggedIn=Boolean(authData.user);
    if(cancelled)return;
    setLoggedIn(userLoggedIn);

    const onIOS=isIOSDevice();
    const installed=isStandalone();
    const iosPushOK=supportsIOSWebPush();
    setIos(onIOS);
    setStandalone(installed);
    setIosPushSupported(iosPushOK);

    if('serviceWorker' in navigator){
     await navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'});
    }

    if(userLoggedIn){
     if(onIOS&&!installed){
      setMode('ios-install');
      setShow(true);
      return;
     }
     if(onIOS&&!iosPushOK){
      setMode('ios-unsupported');
      setShow(true);
      return;
     }
     if('Notification' in window&&'PushManager' in window&&Notification.permission==='granted'){
      const reg=await navigator.serviceWorker.ready;
      const sub=await reg.pushManager.getSubscription();
      if(sub){
       const response=await fetch('/api/push/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(sub.toJSON())});
       if(response.ok)return;
      }
     }
     setMode('notifications');
     setShow(true);
     return;
    }

    if(installed||localStorage.getItem(INSTALL_KEY)==='1')return;
    setMode(onIOS?'ios-install':'install');
    const handler=(event:Event)=>{
     event.preventDefault();
     setInstallEvent(event as BeforeInstallPromptEvent);
     setShow(true);
    };
    const installedHandler=()=>{
     localStorage.setItem(INSTALL_KEY,'1');
     setShow(false);
     setInstallEvent(null);
    };
    window.addEventListener('beforeinstallprompt',handler);
    window.addEventListener('appinstalled',installedHandler);
    const timer=window.setTimeout(()=>setShow(true),900);
    cleanupListeners=()=>{
     window.removeEventListener('beforeinstallprompt',handler);
     window.removeEventListener('appinstalled',installedHandler);
     window.clearTimeout(timer);
    };
   }catch{
    if(!cancelled){
     setMode('install');
     setShow(false);
    }
   }
  };
  void setup();
  return()=>{cancelled=true;cleanupListeners()};
 },[]);

 const complete=()=>{setShow(false);setInstallEvent(null);};
 const install=async()=>{
  if(!installEvent)return;
  setBusy(true);
  try{
   await installEvent.prompt();
   const choice=await installEvent.userChoice;
   if(choice.outcome==='accepted'){localStorage.setItem(INSTALL_KEY,'1');complete();}
  }catch{
   setMessage('Installation could not be started. Use your browser menu to install the app.');
  }finally{setBusy(false);setInstallEvent(null);}
 };

 const enableNotifications=async()=>{
  setBusy(true);
  setMessage('');
  try{
   if(ios&&!standalone){
    setMode('ios-install');
    setMessage('First add this website to your Home Screen, then open the installed app and enable notifications there.');
    return;
   }
   if(ios&&!iosPushSupported){
    setMode('ios-unsupported');
    setMessage('Web Push on iPhone requires iOS 16.4 or later. Update iOS to enable notifications.');
    return;
   }
   if(!('Notification' in window)||!('PushManager' in window)||!('serviceWorker' in navigator)){
    setMessage('Notifications are not supported by this browser. Try an up-to-date browser or install the app.');
    return;
   }
   const permission=Notification.permission==='granted'?'granted':await Notification.requestPermission();
   if(permission!=='granted'){
    setMessage('Notifications were not allowed. Enable them in your device settings, then try again.');
    return;
   }
   const reg=await navigator.serviceWorker.ready;
   const config=await fetch('/api/push/config',{cache:'no-store'}).then(async response=>{
    if(!response.ok)throw new Error('Could not load notification settings.');
    return response.json();
   });
   if(!config.publicKey)throw new Error('Notifications are not configured on the server yet.');
   let sub=await reg.pushManager.getSubscription();
   if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:applicationServerKey(config.publicKey)});
   const response=await fetch('/api/push/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(sub.toJSON())});
   if(!response.ok)throw new Error('The device could not be registered for notifications. Please try again.');
   complete();
  }catch(error){
   setMessage(error instanceof Error?error.message:'Could not enable notifications.');
  }finally{setBusy(false);}
 };

 if(!show)return null;
 const iosInstallMode=mode==='ios-install';
 const unsupportedMode=mode==='ios-unsupported';
 const closeAllowed=!loggedIn||iosInstallMode||unsupportedMode;

 return <div className="pwaInstallOverlay">
  <div className="pwaInstallCard" role="dialog" aria-modal="true" aria-label="Marwan Swedan Academy install and notification prompt">
   {closeAllowed&&<button className="pwaInstallClose" type="button" aria-label="Close" onClick={complete}>×</button>}
   <div className="pwaInstallIcon"><img src="/images/marwan-app-icon.svg" alt="" width="56" height="56"/></div>
   <div className="pwaInstallCopy">
    <div className="eyebrow">Marwan Swedan Academy</div>
    <h3>{iosInstallMode?'Install the Academy':unsupportedMode?'Update iOS to Enable Notifications':loggedIn?'Enable Academy Notifications':'Install the Academy'}</h3>
    <p>{iosInstallMode?'To receive notifications on iPhone/iPad, install the Academy first. In Safari, tap Share, choose Add to Home Screen, then open the new app icon and sign in.':unsupportedMode?'Push notifications on iPhone require iOS 16.4 or later and the website opened from your Home Screen.':loggedIn?'Allow notifications to receive new lessons and course announcements on your device.':'Install Marwan Swedan Academy on your device for quick access. You can enable notifications after signing in.'}</p>
    {iosInstallMode&&<p className="pwaInstallHint">Safari: <b>Share → Add to Home Screen → Add</b>. If you do not see this option, open the site in Safari rather than an in-app browser.</p>}
    {message&&<p className="pwaInstallHint">{message}</p>}
   </div>
   <div className="pwaInstallActions">
    {!loggedIn&&installEvent&&<button className="btn primary" onClick={install} disabled={busy}>{busy?'Installing…':'Install App'}</button>}
    {loggedIn&&mode==='notifications'&&<button className="btn primary" onClick={enableNotifications} disabled={busy}>{busy?'Enabling…':'Enable Notifications'}</button>}
    {loggedIn&&mode==='notifications'&&message&&<button className="btn primary" onClick={enableNotifications} disabled={busy}>{busy?'Checking…':'Try Again'}</button>}
    {(iosInstallMode||unsupportedMode||(!loggedIn&&ios&&!installEvent))&&<button className="btn primary" onClick={complete}>Got it</button>}
   </div>
  </div>
 </div>;
}
