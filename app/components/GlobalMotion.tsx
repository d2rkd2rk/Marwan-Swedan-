'use client';
import {useEffect} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

export default function GlobalMotion(){
 useEffect(()=>{
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  gsap.registerPlugin(ScrollTrigger);

  const progress=document.createElement('div');
  progress.className='motionProgress';
  document.body.appendChild(progress);

  const cursor=document.createElement('div');
  cursor.className='motionCursor';
  document.body.appendChild(cursor);

  const photo=document.querySelector<HTMLElement>('.heroArt,.heroVisual');
  const glow=photo?Object.assign(document.createElement('div'),{className:'photoGlow'}):null;
  if(photo&&glow)photo.appendChild(glow);

  let mx=0,my=0,cx=0,cy=0,lastRipple=0;
  const finePointer=window.matchMedia('(pointer:fine)').matches;

  const move=(e:MouseEvent)=>{
   mx=e.clientX;my=e.clientY;
   cursor.style.opacity='1';
   const now=performance.now();
   if(finePointer&&now-lastRipple>120){
    const r=document.createElement('div');
    r.className='motionRipple';
    r.style.left=`${mx}px`;
    r.style.top=`${my}px`;
    document.body.appendChild(r);
    r.addEventListener('animationend',()=>r.remove(),{once:true});
    lastRipple=now;
   }
   if(photo){
    const b=photo.getBoundingClientRect();
    const near=e.clientX>b.left-100&&e.clientX<b.right+100&&e.clientY>b.top-100&&e.clientY<b.bottom+100;
    cursor.classList.toggle('nearPhoto',near);
    if(near){
     const gx=((e.clientX-b.left)/b.width)*100;
     const gy=((e.clientY-b.top)/b.height)*100;
     photo.style.setProperty('--gx',`${Math.max(0,Math.min(100,gx))}%`);
     photo.style.setProperty('--gy',`${Math.max(0,Math.min(100,gy))}%`);
    }
   }
  };
  const leave=()=>{cursor.style.opacity='0';cursor.classList.remove('nearPhoto')};
  const click=(e:MouseEvent)=>{
   const b=document.createElement('div');
   b.className='clickBurst';
   b.style.left=`${e.clientX}px`;
   b.style.top=`${e.clientY}px`;
   document.body.appendChild(b);
   b.addEventListener('animationend',()=>b.remove(),{once:true});
   const target=e.target as HTMLElement;
   const interactive=target?.closest?.('button,a,.btn');
   if(interactive)gsap.fromTo(interactive,{scale:1},{scale:.97,duration:.08,yoyo:true,repeat:1,ease:'power2.out',overwrite:true});
  };
  const scroll=()=>{
   const max=document.documentElement.scrollHeight-window.innerHeight;
   progress.style.transform=`scaleX(${max>0?window.scrollY/max:0})`;
  };
  const tick=()=>{
   cx+=(mx-cx)*.18;cy+=(my-cy)*.18;
   cursor.style.left=`${cx}px`;cursor.style.top=`${cy}px`;
   raf=requestAnimationFrame(tick);
  };
  let raf=requestAnimationFrame(tick);

  window.addEventListener('mousemove',move,{passive:true});
  window.addEventListener('mouseleave',leave);
  window.addEventListener('click',click);
  window.addEventListener('scroll',scroll,{passive:true});
  scroll();

  const ctx=gsap.context(()=>{
   const heroCopy=document.querySelector<HTMLElement>('.heroCopy');
   const heroVisual=document.querySelector<HTMLElement>('.heroVisual');
   if(heroCopy)gsap.from(heroCopy.children,{y:28,opacity:0,duration:.8,stagger:.08,ease:'power3.out'});
   if(heroVisual){
    gsap.from(heroVisual,{y:22,opacity:0,scale:.975,duration:1,delay:.12,ease:'power3.out'});
    gsap.to(heroVisual,{y:-7,duration:4.5,repeat:-1,yoyo:true,ease:'sine.inOut'});
   }

   gsap.utils.toArray<HTMLElement>('.section,.academyBanner,.signature,.footer').forEach((el,i)=>{
    gsap.fromTo(el,{y:30,opacity:.001},{y:0,opacity:1,duration:.75,ease:'power3.out',delay:(i%3)*.04,scrollTrigger:{trigger:el,start:'top 88%',once:true}});
   });

   gsap.utils.toArray<HTMLElement>('.card,.projectCard,.course,.courseCard,.feature,.whyItem,.lesson,.accessRow,.cert,.pathCard,.pathCourseRow,.role').forEach((el,i)=>{
    gsap.fromTo(el,{y:22,opacity:.001,scale:.985},{y:0,opacity:1,scale:1,duration:.65,ease:'power3.out',delay:(i%6)*.045,scrollTrigger:{trigger:el,start:'top 92%',once:true}});
   });

   gsap.utils.toArray<HTMLElement>('h1,h2').forEach(el=>{
    gsap.fromTo(el,{y:18,opacity:.001},{y:0,opacity:1,duration:.7,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 90%',once:true}});
   });

   gsap.utils.toArray<HTMLElement>('.btn').forEach(el=>{
    const enter=()=>gsap.to(el,{y:-2,duration:.2,ease:'power2.out',overwrite:true});
    const exit=()=>gsap.to(el,{y:0,duration:.25,ease:'power2.out',overwrite:true});
    el.addEventListener('mouseenter',enter);
    el.addEventListener('mouseleave',exit);
   });

   gsap.to('.ambient',{backgroundPosition:'50% 8%',duration:12,repeat:-1,yoyo:true,ease:'sine.inOut'});
  });

  return()=>{
   cancelAnimationFrame(raf);
   window.removeEventListener('mousemove',move);
   window.removeEventListener('mouseleave',leave);
   window.removeEventListener('click',click);
   window.removeEventListener('scroll',scroll);
   ctx.revert();
   if(glow)glow.remove();
   progress.remove();
   cursor.remove();
  };
 },[]);
 return null;
}
