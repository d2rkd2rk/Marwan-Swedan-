'use client';
import {useEffect} from 'react';

export default function AdminEnhancements(){
 useEffect(()=>{
  if(location.pathname!=='/admin')return;
  let stopped=false;
  const install=async()=>{
   try{
    const r=await fetch('/api/admin/users',{cache:'no-store'});const j=await r.json();if(!r.ok||!j.users)return;
    const users=j.users as any[];
    document.querySelectorAll<HTMLTableRowElement>('.table tbody tr').forEach(row=>{
     const text=row.textContent||'';const user=users.find(u=>text.includes(u.email)||text.includes('@'+u.username));if(!user)return;

     if(!row.querySelector('[data-password-access]')){
      const cell=document.createElement('td');cell.setAttribute('data-password-access','1');cell.style.whiteSpace='nowrap';
      const button=document.createElement('button');button.className='btn';button.type='button';
      const sync=()=>{button.textContent=user.password_change_allowed?'Close password change':'Allow password change';button.title=user.password_change_allowed?'Disable the temporary password-change permission':'Let this user set a new password without entering the current password'};
      sync();
      button.onclick=async()=>{
       button.disabled=true;button.textContent='Saving…';
       try{
        const method=user.password_change_allowed?'DELETE':'POST';
        const res=await fetch(`/api/admin/users/${user.id}/password-access`,{method});
        const data=await res.json();if(!res.ok)throw new Error(data.error||'Could not update password access.');
        user.password_change_allowed=Boolean(data.user?.password_change_allowed);sync();
        alert(user.password_change_allowed?'Password change is now enabled for this account.':'Password change access is now closed.');
       }catch(e){sync();alert(e instanceof Error?e.message:'Could not update password access.')}finally{button.disabled=false}
      };
      cell.appendChild(button);row.appendChild(cell);
     }

     if(!row.querySelector('[data-delete-account]')){
      const cell=document.createElement('td');cell.setAttribute('data-delete-account','1');cell.style.whiteSpace='nowrap';
      const button=document.createElement('button');button.className='btn dangerBtn';button.type='button';button.textContent='Delete account';
      button.onclick=async()=>{
       const confirmation=window.prompt(`Permanently delete ${user.name} (@${user.username})? Type DELETE to confirm.`);
       if(confirmation!=='DELETE')return;
       button.disabled=true;button.textContent='Deleting…';
       try{const res=await fetch(`/api/admin/users/${user.id}`,{method:'DELETE'});const data=await res.json();if(!res.ok)throw new Error(data.error||'Could not delete account.');row.remove();alert('Account deleted permanently.')}catch(e){button.disabled=false;button.textContent='Delete account';alert(e instanceof Error?e.message:'Could not delete account.')}
      };
      cell.appendChild(button);row.appendChild(cell);
     }
    });
   }catch{}
  };
  const timer=window.setInterval(()=>{if(!stopped)install()},800);install();
  return()=>{stopped=true;clearInterval(timer)};
 },[]);
 return null;
}
