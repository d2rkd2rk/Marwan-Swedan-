'use client';
import Image from 'next/image';
import {useState} from 'react';

export default function CourseThumbnail({src,alt,category='Cybersecurity'}:{src?:string|null;alt?:string;category?:string}){
  const [failed,setFailed]=useState(false);
  const usable=Boolean(src&&String(src).startsWith('/images/'))&&!failed;
  return <div className="courseCardMedia">
    {usable?<Image src={String(src)} alt={alt||''} fill sizes="(max-width: 800px) 100vw, 25vw" style={{objectFit:'cover'}} onError={()=>setFailed(true)}/>:<div className="courseCardFallback"><div className="fallbackGrid"/><span>{category||'Cybersecurity'}</span><b>&lt;/&gt;</b></div>}
  </div>;
}