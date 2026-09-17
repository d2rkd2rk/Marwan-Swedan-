'use client';
import {useEffect} from 'react';
import gsap from 'gsap';

export default function GlobalMotion(){
 useEffect(()=>{
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const cursor=document.createElement('div');cursor.className='motionCursor';document.body.appendChild(cursor);
  const photo=document.querySelector<HTMLElement>('.heroArt');
  let mx=0,my=0,cx=0,cy=0,lastRipple=0;
  const move=(e:MouseEvent)=>{mx=e.clientX;my=e.clientY;cursor.style.opacity='1';const now=performance.now();if(now-lastRipple>95){const r=document.createElement('div');r.className='motionRipple';r.style.left=`${mx}px`;r.style.top=`${my}px`;document.body.appendChild(r);r.addEventListener('animationend',()=>r.remove(),{once:true});lastRipple=now}if(photo){const b=photo.getBoundingClientRect();const near=e.clientX>b.left-80&&e.clientX<b.right+80&&e.clientY>b.top-80&&e.clientY<b.bottom+80;cursor.classList.toggle('nearPhoto',near);if(near){const gx=((e.clientX-b.left)/b.width)*100;const gy=((e.clientY-b.top)/b.height)*100;photo.style.setProperty('--gx',`${Math.max(0,Math.min(100,gx))}%`);photo.style.setProperty('--gy',`${Math.max(0,Math.min(100,gy))}%`)}}};
  const leave=()=>{cursor.style.opacity='0';cursor.classList.remove('nearPhoto')};
  const click=(e:MouseEvent)=>{const b=document.createElement('div');b.className='clickBurst';b.style.left=`${e.clientX}px`;b.style.top=`${e.clientY}px`;document.body.appendChild(b);b.addEventListener('animationend',()=>b.remove(),{once:true});gsap.fromTo(e.target as HTMLElement,{scale:1},{scale:.97,duration:.08,yoyo:true,repeat:1,ease:'power2.out',overwrite:true})};
  const tick=()=>{cx+=(mx-cx)*.18;cy+=(my-cy)*.18;cursor.style.left=`${cx}px`;cursor.style.top=`${cy}px`;raf=requestAnimationFrame(tick)};let raf=requestAnimationFrame(tick);
  window.addEventListener('mousemove',move,{passive:true});window.addEventListener('mouseleave',leave);window.addEventListener('click',click);
  const ctx=gsap.context(()=>{gsap.utils.toArray<HTMLElement>('.card,.projectCard,.course,.feature,.whyItem,.lesson,.accessRow,.cert,.academyBanner').forEach((el,i)=>{gsap.fromTo(el,{y:18,opacity:.001},{y:0,opacity:1,duration:.7,ease:'power3.out',delay:(i%5)*.04,scrollTrigger:{trigger:el,start:'top 92%',once:true}})});});
  return()=>{cancelAnimationFrame(raf);window.removeEventListener('mousemove',move);window.removeEventListener('mouseleave',leave);window.removeEventListener('click',click);ctx.revert();cursor.remove()};
 },[]);
 return null;
}
