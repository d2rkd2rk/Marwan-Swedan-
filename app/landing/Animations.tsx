'use client';

import {useLayoutEffect} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

export default function Animations(){
 useLayoutEffect(()=>{
  gsap.registerPlugin(ScrollTrigger);
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const ctx=gsap.context(()=>{
   const intro=gsap.timeline({defaults:{ease:'power4.out'}});
   intro.from('.nav',{y:-35,opacity:0,duration:.8})
    .from('.heroKicker',{y:20,opacity:0,filter:'blur(8px)',duration:.55},'-.35')
    .from('.heroIndex',{x:-25,opacity:0,duration:.5},'-.2')
    .from('.heroTitle span',{y:120,opacity:0,clipPath:'inset(0 0 100% 0)',duration:1.05,stagger:.12},'-.15')
    .from('.heroTitle em',{y:120,opacity:0,clipPath:'inset(0 0 100% 0)',duration:1.15},'-.8')
    .from('.heroLead',{y:35,opacity:0,duration:.7},'-.65')
    .from('.hero .actions .btn',{y:25,opacity:0,stagger:.12,duration:.55},'-.45')
    .fromTo('.heroArt',{x:80,opacity:0,scale:1.08},{x:0,opacity:1,scale:1,duration:1.25},'-.9')
    .from('.heroFrame',{opacity:0,scale:.96,duration:.7},'-.45')
    .from('.heroBottom',{y:18,opacity:0,duration:.5},'-.3');

   gsap.to('.heroImg',{scale:1.13,y:-45,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1}});
   gsap.to('.heroTitle',{y:-80,opacity:.18,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1}});
   gsap.to('.heroFrame',{y:-12,repeat:-1,yoyo:true,duration:3,ease:'sine.inOut'});
   gsap.to('.dot',{scale:1.5,opacity:.45,repeat:-1,yoyo:true,duration:1.1,ease:'sine.inOut'});

   gsap.to('.marqueeTrack',{xPercent:-50,ease:'none',duration:28,repeat:-1});

   gsap.utils.toArray<HTMLElement>('.focusCard,.courseCard,.experienceInteractive,.certInteractive').forEach((el,i)=>{
    gsap.fromTo(el,{opacity:0,y:70,rotateX:8,scale:.96},{opacity:1,y:0,rotateX:0,scale:1,duration:.9,ease:'power4.out',delay:(i%4)*.06,scrollTrigger:{trigger:el,start:'top 88%',once:true}});
   });
   gsap.utils.toArray<HTMLElement>('.sectionHead,.aboutCopy,.certTop').forEach(el=>{
    gsap.fromTo(el,{opacity:0,y:80,clipPath:'inset(0 0 100% 0)'},{opacity:1,y:0,clipPath:'inset(0 0 0% 0)',duration:1.05,ease:'power4.out',scrollTrigger:{trigger:el,start:'top 84%',once:true}});
   });
   gsap.utils.toArray<HTMLElement>('.sectionNumber').forEach(el=>{
    gsap.fromTo(el,{x:-60,opacity:0},{x:0,opacity:.55,duration:1,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 88%',once:true}});
   });
   gsap.utils.toArray<HTMLElement>('.section h2').forEach(el=>{
    gsap.fromTo(el,{y:90,opacity:0,letterSpacing:'-.08em'},{y:0,opacity:1,letterSpacing:'-.055em',duration:1.05,ease:'power4.out',scrollTrigger:{trigger:el,start:'top 82%',once:true}});
   });
   gsap.utils.toArray<HTMLElement>('.aboutStage,.courseStage,.experienceStage,.certStage,.finalStage').forEach(el=>{
    gsap.fromTo(el,{backgroundPosition:'0% 50%'},{backgroundPosition:'100% 50%',ease:'none',scrollTrigger:{trigger:el,start:'top bottom',end:'bottom top',scrub:1.5}});
   });

   const cursor=document.querySelector('.cursorGlow') as HTMLElement|null;
   const quickX=cursor?gsap.quickTo(cursor,'x',{duration:.45,ease:'power3'}):null;
   const quickY=cursor?gsap.quickTo(cursor,'y',{duration:.45,ease:'power3'}):null;
   const move=(e:MouseEvent)=>{quickX?.(e.clientX);quickY?.(e.clientY);};
   window.addEventListener('mousemove',move,{passive:true});

   const cleanups:Array<()=>void>=[];
   gsap.utils.toArray<HTMLElement>('.btn,.focusCard,.courseCard,.experienceInteractive,.certInteractive').forEach(el=>{
    const qx=gsap.quickTo(el,'x',{duration:.28,ease:'power3.out'});
    const qy=gsap.quickTo(el,'y',{duration:.28,ease:'power3.out'});
    const enter=()=>{gsap.to(el,{scale:1.025,duration:.25,ease:'power2.out'});};
    const leave=()=>{qx(0);qy(0);gsap.to(el,{scale:1,duration:.35,ease:'power2.out'});};
    const magnetic=(e:MouseEvent)=>{const r=el.getBoundingClientRect();qx((e.clientX-r.left-r.width/2)*.045);qy((e.clientY-r.top-r.height/2)*.045);};
    el.addEventListener('mouseenter',enter);el.addEventListener('mouseleave',leave);el.addEventListener('mousemove',magnetic);
    cleanups.push(()=>{el.removeEventListener('mouseenter',enter);el.removeEventListener('mouseleave',leave);el.removeEventListener('mousemove',magnetic);});
   });

   gsap.utils.toArray<HTMLElement>('.certInteractive').forEach(el=>{
    const tilt=(e:MouseEvent)=>{const r=el.getBoundingClientRect();const rx=((e.clientY-r.top)/r.height-.5)*-5;const ry=((e.clientX-r.left)/r.width-.5)*5;gsap.to(el,{rotateX:rx,rotateY:ry,duration:.25,overwrite:true});};
    const reset=()=>gsap.to(el,{rotateX:0,rotateY:0,duration:.5});
    el.addEventListener('mousemove',tilt);el.addEventListener('mouseleave',reset);
    cleanups.push(()=>{el.removeEventListener('mousemove',tilt);el.removeEventListener('mouseleave',reset);});
   });
   // Cinematic interaction layer
   gsap.utils.toArray<HTMLElement>('.heroKicker,.heroIndex,.heroLead,.heroBottom').forEach((el,i)=>{
    gsap.to(el,{x:i%2?12:-12,scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1.4}});
   });
   gsap.utils.toArray<HTMLElement>('.focusCard').forEach((el,i)=>{
    gsap.to(el,{y:i%2?-18:18,rotateZ:i%2?-1.2:1.2,scrollTrigger:{trigger:'.aboutStage',start:'top bottom',end:'bottom top',scrub:1.8}});
   });
   gsap.utils.toArray<HTMLElement>('.courseCard').forEach((el,i)=>{
    gsap.to(el,{y:i%3===0?-24:i%3===1?12:-12,scrollTrigger:{trigger:'.courseStage',start:'top bottom',end:'bottom top',scrub:1.5}});
   });
   gsap.utils.toArray<HTMLElement>('.experienceInteractive').forEach((el,i)=>{
    gsap.fromTo(el,{x:i%2?-45:45},{x:0,scrollTrigger:{trigger:el,start:'top 92%',end:'top 65%',scrub:1}});
   });
   gsap.utils.toArray<HTMLElement>('.certInteractive').forEach((el,i)=>{
    gsap.fromTo(el,{clipPath:i%2?'inset(0 0 0 100%)':'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0%)',scrollTrigger:{trigger:el,start:'top 92%',end:'top 70%',scrub:1}});
   });
   gsap.to('.finalMark',{rotation:-8,x:35,y:-20,scrollTrigger:{trigger:'.finalStage',start:'top bottom',end:'bottom top',scrub:2}});
   gsap.utils.toArray<HTMLElement>('.section').forEach((el,i)=>{
    gsap.to(el,{backgroundPosition:i%2?'72% 38%':'28% 62%',scrollTrigger:{trigger:el,start:'top bottom',end:'bottom top',scrub:2}});
   });

   // Hover spotlight follows each interactive surface.
   gsap.utils.toArray<HTMLElement>('.focusCard,.courseCard,.experienceInteractive,.certInteractive').forEach(el=>{
    const spot=document.createElement('span');
    spot.className='interactionSpot';
    el.appendChild(spot);
    const moveSpot=(e:MouseEvent)=>{const r=el.getBoundingClientRect();spot.style.left=(e.clientX-r.left)+'px';spot.style.top=(e.clientY-r.top)+'px';};
    const enter=()=>gsap.to(spot,{opacity:1,duration:.25});
    const leave=()=>gsap.to(spot,{opacity:0,duration:.35});
    el.addEventListener('mousemove',moveSpot);el.addEventListener('mouseenter',enter);el.addEventListener('mouseleave',leave);
    cleanups.push(()=>{el.removeEventListener('mousemove',moveSpot);el.removeEventListener('mouseenter',enter);el.removeEventListener('mouseleave',leave);spot.remove();});
   });

   return()=>{window.removeEventListener('mousemove',move);cleanups.forEach(fn=>fn());};
  });
  return()=>ctx.revert();
 },[]);
 return null;
}
