'use client'
import { useEffect } from 'react'
import { animate, inView } from 'framer-motion'

export default function HomeMotion() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const menu = document.querySelector<HTMLElement>('#site-menu')
    const panel = menu?.querySelector<HTMLElement>('.menuPanel')
    const toggle = document.querySelector<HTMLElement>('[data-menu-toggle]')
    const closeButtons = menu ? Array.from(menu.querySelectorAll<HTMLElement>('[data-menu-close]')) : []
    const links = menu ? Array.from(menu.querySelectorAll<HTMLElement>('[data-menu-link]')) : []
    const cleanups: Array<() => void> = []
    const openMenu = () => {
      if (!menu || !panel) return
      menu.style.visibility='visible'; menu.style.pointerEvents='auto'; menu.setAttribute('aria-hidden','false'); toggle?.setAttribute('aria-expanded','true')
      if(reduce){menu.style.opacity='1';panel.style.clipPath='inset(0 0 0 0)';return}
      animate(menu,{opacity:[0,1]},{duration:.2})
      animate(panel,{clipPath:['inset(0 0 0 100%)','inset(0 0 0 0%)']},{duration:.7,ease:[.22,1,.36,1]})
      animate(links,{opacity:[0,1],y:[24,0]},{duration:.5,delay:(_,i)=>.12+i*.055,ease:[.22,1,.36,1]})
    }
    const closeMenu = () => {
      if(!menu||!panel)return
      toggle?.setAttribute('aria-expanded','false')
      if(reduce){menu.style.opacity='0';menu.style.visibility='hidden';menu.style.pointerEvents='none';menu.setAttribute('aria-hidden','true');return}
      animate(panel,{clipPath:['inset(0 0 0 0%)','inset(0 0 0 100%)']},{duration:.55,ease:[.65,0,.35,1]}).then(()=>{menu.style.visibility='hidden';menu.style.pointerEvents='none';menu.setAttribute('aria-hidden','true')})
    }
    const toggleMenu=()=>toggle?.getAttribute('aria-expanded')==='true'?closeMenu():openMenu()
    toggle?.addEventListener('click',toggleMenu); closeButtons.forEach(x=>x.addEventListener('click',closeMenu)); links.forEach(x=>x.addEventListener('click',closeMenu))
    cleanups.push(()=>{toggle?.removeEventListener('click',toggleMenu);closeButtons.forEach(x=>x.removeEventListener('click',closeMenu));links.forEach(x=>x.removeEventListener('click',closeMenu))})
    const home=document.querySelector<HTMLElement>('.home')
    if(home){home.classList.add('motion-ready');if(!reduce){
      const hero=document.querySelector<HTMLElement>('[data-hero-title]'); if(hero)animate(hero,{opacity:[0,1],y:[26,0]},{duration:.9,ease:[.22,1,.36,1]})
      const visual=document.querySelector<HTMLElement>('[data-hero-visual]'); if(visual)animate(visual,{opacity:[0,1],scale:[.965,1]},{duration:1,delay:.12,ease:[.22,1,.36,1]})
      document.querySelectorAll<HTMLElement>('[data-reveal]').forEach(el=>cleanups.push(inView(el,()=>animate(el,{opacity:[0,1],y:[28,0]},{duration:.7,ease:[.22,1,.36,1]}),{margin:'0px 0px -80px 0px'})))
      document.querySelectorAll<HTMLElement>('[data-tilt]').forEach(el=>{const move=(e:PointerEvent)=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;el.style.transform=`perspective(900px) rotateX(${(-y*3).toFixed(2)}deg) rotateY(${(x*4).toFixed(2)}deg) translateY(-4px)`};const leave=()=>{el.style.transform=''};el.addEventListener('pointermove',move);el.addEventListener('pointerleave',leave);cleanups.push(()=>{el.removeEventListener('pointermove',move);el.removeEventListener('pointerleave',leave)})})
    }}
    return()=>cleanups.forEach(x=>x())
  },[])
  return null
}
