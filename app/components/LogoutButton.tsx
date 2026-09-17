'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';

export default function LogoutButton({mobile=false}:{mobile?:boolean}){
  const router=useRouter();
  const [loading,setLoading]=useState(false);

  async function logout(){
    if(loading)return;
    setLoading(true);
    try{
      await fetch('/api/auth/logout',{method:'POST'});
    }finally{
      router.replace('/login');
      router.refresh();
    }
  }

  return <button type="button" className={mobile?'mobileLogout':'btn logoutBtn'} onClick={logout} disabled={loading}>
    {loading?'Signing out…':'Logout'}
  </button>;
}
