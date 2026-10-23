'use client';

import {useEffect} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

export default function Animations(){
 useEffect(()=>{
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch=window.matchMedia('(hover: none), (pointer: coarse), (max-width: 760px)').matches;
  if(reduce||touch)return;
  gsap.registerPlugin(ScrollTrigger);
  const ctx=gsap.context(()=>{
   gsap.from('.nav',{y:-12,opacity:0,duration:.35,ease:'power2.out'});
   gsap.from('.heroKicker,.heroIndex,.heroTitle,.heroLead,.hero .actions',{y:14,opacity:0,duration:.45,stagger:.06,ease:'power2.out',delay:.08});
   gsap.from('.heroArt',{opacity:0,duration:.55,ease:'power1.out',delay:.12});
   gsap.utils.toArray<HTMLElement>('.focusCard,.courseCard,.experienceInteractive,.certInteractive').forEach(el=>{
    gsap.from(el,{opacity:0,y:18,duration:.35,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 92%',once:true}});
   });
   gsap.utils.toArray<HTMLElement>('.sectionHead,.aboutCopy,.certTop').forEach(el=>{
    gsap.from(el,{opacity:0,y:16,duration:.35,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 92%',once:true}});
   });
  });
  return()=>ctx.revert();
 },[]);
 return null;
}
