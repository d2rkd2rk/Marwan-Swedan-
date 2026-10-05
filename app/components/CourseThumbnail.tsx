'use client';
import Image from 'next/image';
import {useState} from 'react';

export default function CourseThumbnail({src,alt,category='Cybersecurity'}:{src?:string|null;alt?:string;category?:string}){
  const [failed,setFailed]=useState(false);
  const value=String(src||'');
  const local=Boolean(value&&value.startsWith('/images/'));
  const api=Boolean(value&&value.startsWith('/api/course-image?pathname='));
  const usable=(local||api)&&!failed;
  return <div className="courseCardMedia">
    {usable?(local?<Image src={value} alt={alt||''} fill sizes="(max-width: 800px) 100vw, 25vw" style={{objectFit:'cover'}} onError={()=>setFailed(true)}/>:<img src={value} alt={alt||''} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}} onError={()=>setFailed(true)}/>):<div className="courseCardFallback"><div className="fallbackGrid"/><span>{category||'Cybersecurity'}</span><b>&lt;/&gt;</b></div>}
  </div>;
}