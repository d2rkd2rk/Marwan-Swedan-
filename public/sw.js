const SW_VERSION='msa-push-v2';

self.addEventListener('install',event=>{
 event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate',event=>{
 event.waitUntil(self.clients.claim());
});

self.addEventListener('push',event=>{
 const fallback={title:'Marwan Swedan Academy',body:'You have a new update.',url:'/'};
 let data=fallback;
 try{
  if(event.data)data={...fallback,...event.data.json()};
 }catch(error){
  console.error('PUSH_PAYLOAD_PARSE_FAILED',error);
 }
 event.waitUntil((async()=>{
  try{
   await self.registration.showNotification(data.title,{
    body:data.body,
    icon:'/images/marwan-app-icon.svg',
    badge:'/images/marwan-app-icon.svg',
    data:{url:data.url||'/'},
    tag:data.tag||'marwan-academy',
    requireInteraction:false
   });
  }catch(error){
   console.error('PUSH_NOTIFICATION_DISPLAY_FAILED',error);
  }
 })());
});

self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const url=event.notification.data?.url||'/';
 event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(clients=>{
  for(const client of clients){
   if('focus' in client){
    if('navigate' in client)client.navigate(url);
    return client.focus();
   }
  }
  return self.clients.openWindow(url);
 }));
});
