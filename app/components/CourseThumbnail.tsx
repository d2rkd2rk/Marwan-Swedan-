'use client';
import {useState} from 'react';

export default function CourseThumbnail({src,alt,category='Cybersecurity'}:{src?:string|null;alt?:string;category?:string}){
  const [failed,setFailed]=useState(false);
  const value=String(src||'');
  const usable=Boolean(value)&&!failed;
  return <div className="courseCardMedia">
    {usable?<img src={value} alt={alt||''} loading="lazy" decoding="async" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}} onError={()=>setFailed(true)}/>:<div className="courseCardFallback"><div className="fallbackGrid"/><span>{category||'Cybersecurity'}</span><b>&lt;/&gt;</b></div>}
  </div>;
}
