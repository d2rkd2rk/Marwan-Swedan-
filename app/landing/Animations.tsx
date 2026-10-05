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
      intro.from('.nav',{y:-25,opacity:0,duration:.7})
        .from('.eyebrow',{y:18,opacity:0,filter:'blur(8px)',duration:.55},'-=.3')
        .from('.hero h1',{y:65,opacity:0,clipPath:'inset(0 0 100% 0)',duration:1.1},'-=.2')
        .from('.hero p',{y:28,opacity:0,duration:.75},'-=.6')
        .from('.actions .btn',{y:20,opacity:0,stagger:.1,duration:.55},'-=.45')
        .from('.skills span',{y:12,opacity:0,stagger:.08,duration:.4},'-=.3')
        .fromTo('.heroArt',{x:45,opacity:0,scale:1.04},{x:0,opacity:1,scale:1,duration:1.1},'-=.8')
        .fromTo('.heroImg',{scale:1.1},{scale:1,duration:1.5,ease:'power2.out'},'-=1');

      gsap.utils.toArray<HTMLElement>('.feature,.course,.whyItem,.experienceItem,.certItem,.journey,.footer > div').forEach((el,i)=>{
        gsap.fromTo(el,{opacity:0,y:55,scale:.985},{opacity:1,y:0,scale:1,duration:.85,ease:'power4.out',delay:i%4*.06,scrollTrigger:{trigger:el,start:'top 88%',once:true}});
      });
      gsap.utils.toArray<HTMLElement>('.sectionHead,.whyIntro').forEach(el=>{
        gsap.fromTo(el,{opacity:0,y:60,clipPath:'inset(0 0 100% 0)'},{opacity:1,y:0,clipPath:'inset(0 0 0% 0)',duration:1,ease:'power4.out',scrollTrigger:{trigger:el,start:'top 84%',once:true}});
      });
      gsap.utils.toArray<HTMLElement>('.section,.journey').forEach(el=>{
        gsap.fromTo(el,{backgroundPosition:'0% 50%'},{backgroundPosition:'100% 50%',duration:1.8,ease:'none',scrollTrigger:{trigger:el,start:'top bottom',end:'bottom top',scrub:1.2}});
      });
      gsap.utils.toArray<HTMLElement>('.section h2,.journey h2').forEach(el=>{
        gsap.fromTo(el,{y:80,opacity:0,letterSpacing:'-.07em'},{y:0,opacity:1,letterSpacing:'-.04em',duration:1,ease:'power4.out',scrollTrigger:{trigger:el,start:'top 82%',once:true}});
      });

      const art=document.querySelector('.heroArt');
      const img=document.querySelector('.heroImg');
      const quickX=img?gsap.quickTo(img,'x',{duration:.8,ease:'power3'}):null;
      const quickY=img?gsap.quickTo(img,'y',{duration:.8,ease:'power3'}):null;
      const move=(e:MouseEvent)=>{
        if(!art||!quickX||!quickY)return;
        const r=art.getBoundingClientRect();
        quickX((e.clientX-r.left-r.width/2)*.025);
        quickY((e.clientY-r.top-r.height/2)*.018);
      };
      window.addEventListener('mousemove',move,{passive:true});

      const cleanups:Array<()=>void>=[];
      gsap.utils.toArray<HTMLElement>('.btn').forEach(btn=>{
        const x=gsap.quickTo(btn,'x',{duration:.25,ease:'power2.out'});
        const y=gsap.quickTo(btn,'y',{duration:.25,ease:'power2.out'});
        const enter=()=>gsap.to(btn,{scale:1.035,duration:.25,ease:'power2.out'});
        const leave=()=>{x(0);y(0);gsap.to(btn,{scale:1,duration:.3,ease:'power2.out'});};
        const magnetic=(e:MouseEvent)=>{const r=btn.getBoundingClientRect();x((e.clientX-r.left-r.width/2)*.12);y((e.clientY-r.top-r.height/2)*.12);};
        btn.addEventListener('mouseenter',enter);btn.addEventListener('mouseleave',leave);btn.addEventListener('mousemove',magnetic);
        cleanups.push(()=>{btn.removeEventListener('mouseenter',enter);btn.removeEventListener('mouseleave',leave);btn.removeEventListener('mousemove',magnetic);});
      });
      gsap.to('.dot',{scale:1.35,opacity:.55,repeat:-1,yoyo:true,duration:1.1,ease:'sine.inOut'});
      gsap.to('.logoMark',{rotation:360,duration:12,repeat:-1,ease:'none'});
      gsap.to('.heroArt',{y:-8,repeat:-1,yoyo:true,duration:3.8,ease:'sine.inOut'});
      gsap.to('.icon',{y:-4,repeat:-1,yoyo:true,stagger:.12,duration:1.8,ease:'sine.inOut'});

      return()=>{window.removeEventListener('mousemove',move);cleanups.forEach(fn=>fn());};
    });
    return()=>ctx.revert();
  },[]);
  return null;
}
