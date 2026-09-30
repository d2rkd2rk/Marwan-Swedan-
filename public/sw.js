self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{
 let data={title:'Marwan Swedan Academy',body:'You have a new update.',url:'/'};
 try{if(event.data)data={...data,...event.data.json()}}catch{}
 event.waitUntil(self.registration.showNotification(data.title,{body:data.body,icon:'/images/profile.jpg',badge:'/images/profile.jpg',data:{url:data.url||'/'},tag:data.tag||'marwan-academy'}));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const url=event.notification.data?.url||'/';
 event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(clients=>{
  for(const client of clients){if('focus' in client){client.navigate(url);return client.focus()}}
  return self.clients.openWindow(url);
 }));
});