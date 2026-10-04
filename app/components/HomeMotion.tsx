'use client';
import {useEffect} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

export default function HomeMotion(){
 useEffect(()=>{
  gsap.registerPlugin(ScrollTrigger);
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx=gsap.context(()=>{
   const title=gsap.utils.toArray<HTMLElement>('[data-hero-title] span');
   if(!reduce){
    gsap.fromTo(title,{yPercent:115,opacity:0},{yPercent:0,opacity:1,duration:1.05,stagger:.12,ease:'power4.out',delay:.12});
    gsap.fromTo('.home .heroLead,.home .actions,.home .facts',{y:24,opacity:0},{y:0,opacity:1,duration:.75,stagger:.08,ease:'power3.out',delay:.45});
    gsap.fromTo('[data-hero-visual]',{scale:.96,opacity:0},{scale:1,opacity:1,duration:1.15,ease:'power3.out',delay:.2});
    gsap.to('.home .nodes i',{y:-12,duration:2.2,stagger:.25,repeat:-1,yoyo:true,ease:'sine.inOut'});
    gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el,i)=>gsap.fromTo(el,{y:34,opacity:0},{y:0,opacity:1,duration:.72,delay:(i%3)*.06,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 88%',once:true}}));
   }
  });
  const menu=document.querySelector<HTMLElement>('.menu'),panel=menu?.querySelector<HTMLElement>('.menuPanel'),toggle=document.querySelector<HTMLElement>('[data-menu-toggle]');
  const links=menu?Array.from(menu.querySelectorAll<HTMLElement>('[data-menu-link]')):[],closeButtons=menu?Array.from(menu.querySelectorAll<HTMLElement>('[data-menu-close]')):[];
  const tl=menu&&panel?gsap.timeline({paused:true,reversed:true,onReverseComplete:()=>{menu.setAttribute('aria-hidden','true');toggle?.setAttribute('aria-expanded','false')}}):null;
  if(menu&&panel&&tl){
   tl.set(menu,{autoAlpha:1,pointerEvents:'auto'}).fromTo(panel,{clipPath:'inset(0 0 0 100%)'},{clipPath:'inset(0 0 0 0%)',duration:.72,ease:'power4.inOut'}).fromTo('.menuTop',{y:15,opacity:0},{y:0,opacity:1,duration:.35},'-=.3').fromTo(links,{y:30,opacity:0},{y:0,opacity:1,stagger:.065,duration:.55,ease:'power3.out'},'-=.15').fromTo('.menuFooter',{y:12,opacity:0},{y:0,opacity:1,duration:.35},'-=.25');
   const open=()=>{menu.setAttribute('aria-hidden','false');toggle?.setAttribute('aria-expanded','true');tl.play()}; const close=()=>tl.reverse();
   toggle?.addEventListener('click',open); closeButtons.forEach(x=>x.addEventListener('click',close)); links.forEach(x=>x.addEventListener('click',close));
  }
  const tiltEls=Array.from(document.querySelectorAll<HTMLElement>('[data-tilt]'));
  const handlers=tiltEls.map(el=>{const move=(e:PointerEvent)=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;el.style.transform=`perspective(900px) rotateX(${(-y*3).toFixed(2)}deg) rotateY(${(x*4).toFixed(2)}deg)`;};const leave=()=>{el.style.transform='perspective(900px) rotateX(0deg) rotateY(0deg)'};el.addEventListener('pointermove',move);el.addEventListener('pointerleave',leave);return{el,move,leave}});
  return()=>{ctx.revert();tl?.kill();handlers.forEach(({el,move,leave})=>{el.removeEventListener('pointermove',move);el.removeEventListener('pointerleave',leave)});};
 },[]);
 return null;
}
