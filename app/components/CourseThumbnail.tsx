'use client';
import {useState} from 'react';

export default function CourseThumbnail({src,alt}:{src?:string|null;alt?:string;category?:string}){
  const [failed,setFailed]=useState(false);
  const value=String(src||'');
  const usable=Boolean(value)&&!failed;
  return <div style={{position:'absolute',inset:0,width:'100%',height:'100%',overflow:'hidden',zIndex:0}}>
    {usable&&<img src={value} alt={alt||''} loading="eager" fetchPriority="high" decoding="async" style={{display:'block',position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',objectPosition:'center'}} onError={()=>setFailed(true)}/>}
  </div>;
}
