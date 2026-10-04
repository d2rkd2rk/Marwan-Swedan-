'use client';
import {useEffect} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

export default function EliteHomeMotion(){
 useEffect(()=>{
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  gsap.registerPlugin(ScrollTrigger);
  const lenis=new Lenis({duration:1.15,smoothWheel:true,syncTouch:true,lerp:.08});
  lenis.on('scroll',ScrollTrigger.update);
  const raf=(time:number)=>lenis.raf(time*1000);
  gsap.ticker.add(raf);gsap.ticker.lagSmoothing(0);
  const ctx=gsap.context(()=>{
   gsap.from('.eliteHeroCopy>*',{y:34,opacity:0,stagger:.09,duration:.9,ease:'power4.out'});
   gsap.from('.eliteHeroVisual',{scale:.94,opacity:0,duration:1.2,ease:'power4.out',delay:.12});
   gsap.utils.toArray<HTMLElement>('.eliteStatementText,.eliteWorkHead,.eliteProjectsHead,.eliteSkills>div:nth-child(2),.eliteCta').forEach(el=>gsap.from(el,{y:42,opacity:0,duration:.9,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 82%',once:true}}));
   gsap.utils.toArray<HTMLElement>('.eliteRole,.eliteProject,.eliteCourseCard,.eliteSkillList>div').forEach((el,i)=>gsap.from(el,{y:34,opacity:0,duration:.75,delay:(i%4)*.06,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 90%',once:true}}));
  });
  const menu=document.querySelector<HTMLElement>('.eliteMenu'),panel=menu?.querySelector<HTMLElement>('.eliteMenuPanel'),toggle=document.querySelector<HTMLElement>('[data-menu-toggle]');
  const links=menu?Array.from(menu.querySelectorAll<HTMLElement>('[data-menu-link]')):[],closeButtons=menu?Array.from(menu.querySelectorAll<HTMLElement>('[data-menu-close]')):[];
  const tl=menu&&panel?gsap.timeline({paused:true,reversed:true,onReverseComplete:()=>{menu.setAttribute('aria-hidden','true');toggle?.setAttribute('aria-expanded','false')}}):null;
  if(menu&&panel&&tl){
   tl.set(menu,{autoAlpha:1,pointerEvents:'auto'}).fromTo(panel,{clipPath:'circle(0% at 94% 4%)'},{clipPath:'circle(150% at 94% 4%)',duration:.9,ease:'power4.inOut'}).fromTo('.eliteMenuTop',{y:18,opacity:0},{y:0,opacity:1,duration:.4,ease:'power3.out'},'-=.45').fromTo(links,{yPercent:110,opacity:0},{yPercent:0,opacity:1,stagger:.07,duration:.72,ease:'power4.out'},'-=.2').fromTo('.eliteMenuFooter',{y:18,opacity:0},{y:0,opacity:1,duration:.45,ease:'power3.out'},'-=.4');
   const open=()=>{menu.setAttribute('aria-hidden','false');toggle?.setAttribute('aria-expanded','true');tl.play()};
   const close=()=>tl.reverse();toggle?.addEventListener('click',open);closeButtons.forEach(b=>b.addEventListener('click',close));links.forEach(l=>l.addEventListener('click',close));
  }
  const magnets=Array.from(document.querySelectorAll<HTMLElement>('[data-magnetic]'));
  const magneticHandlers=magnets.map(el=>{const move=(e:PointerEvent)=>{const r=el.getBoundingClientRect();gsap.to(el,{x:(e.clientX-(r.left+r.width/2))*.16,y:(e.clientY-(r.top+r.height/2))*.16,duration:.45,ease:'power3.out',overwrite:true})};const leave=()=>gsap.to(el,{x:0,y:0,duration:.7,ease:'elastic.out(1,.35)'});el.addEventListener('pointermove',move);el.addEventListener('pointerleave',leave);return{el,move,leave}});
  const tiltEls=Array.from(document.querySelectorAll<HTMLElement>('[data-tilt]'));
  const tiltHandlers=tiltEls.map(el=>{const move=(e:PointerEvent)=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;el.style.setProperty('--rx',`${(-y*5).toFixed(2)}deg`);el.style.setProperty('--ry',`${(x*7).toFixed(2)}deg`);el.style.setProperty('--mx',`${(x+.5)*100}%`);el.style.setProperty('--my',`${(y+.5)*100}%`)};const leave=()=>{el.style.setProperty('--rx','0deg');el.style.setProperty('--ry','0deg')};el.addEventListener('pointermove',move);el.addEventListener('pointerleave',leave);return{el,move,leave}});
  const cursor=document.createElement('div');cursor.className='eliteCursor';document.body.appendChild(cursor);
  const cursorMove=(e:MouseEvent)=>{cursor.style.transform=`translate3d(${e.clientX}px,${e.clientY}px,0)`};window.addEventListener('mousemove',cursorMove,{passive:true});
  return()=>{gsap.ticker.remove(raf);lenis.destroy();ctx.revert();magneticHandlers.forEach(({el,move,leave})=>{el.removeEventListener('pointermove',move);el.removeEventListener('pointerleave',leave)});tiltHandlers.forEach(({el,move,leave})=>{el.removeEventListener('pointermove',move);el.removeEventListener('pointerleave',leave)});window.removeEventListener('mousemove',cursorMove);cursor.remove();tl?.kill()};
 },[]);
 return null;
}