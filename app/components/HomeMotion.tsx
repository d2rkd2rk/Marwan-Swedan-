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
      menu.style.visibility = 'visible'
      menu.style.pointerEvents = 'auto'
      menu.setAttribute('aria-hidden', 'false')
      toggle?.setAttribute('aria-expanded', 'true')
      if (reduce) {
        menu.style.opacity = '1'
        panel.style.clipPath = 'inset(0 0 0 0)'
        return
      }
      animate(menu, { opacity: [0, 1] }, { duration: .2 })
      animate(panel, { clipPath: ['inset(0 0 0 100%)', 'inset(0 0 0 0%)'] }, { duration: .7, ease: [.22, 1, .36, 1] })
      animate(links, { opacity: [0, 1], y: [24, 0] }, { duration: .5, delay: (_, i) => .12 + i * .055, ease: [.22, 1, .36, 1] })
    }

    const closeMenu = () => {
      if (!menu || !panel) return
      toggle?.setAttribute('aria-expanded', 'false')
      if (reduce) {
        menu.style.opacity = '0'
        menu.style.visibility = 'hidden'
        menu.style.pointerEvents = 'none'
        menu.setAttribute('aria-hidden', 'true')
        return
      }
      animate(panel, { clipPath: ['inset(0 0 0 0%)', 'inset(0 0 0 100%)'] }, { duration: .55, ease: [.65, 0, .35, 1] }).then(() => {
        menu.style.visibility = 'hidden'
        menu.style.pointerEvents = 'none'
        menu.setAttribute('aria-hidden', 'true')
      })
    }

    const toggleMenu = () => toggle?.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu()

    toggle?.addEventListener('click', toggleMenu)
    closeButtons.forEach((button) => button.addEventListener('click', closeMenu))
    links.forEach((link) => link.addEventListener('click', closeMenu))

    const home = document.querySelector<HTMLElement>('.home')
    if (home && !reduce) {
      const hero = document.querySelector<HTMLElement>('[data-hero-title]')
      if (hero) animate(hero, { opacity: [0, 1], y: [26, 0] }, { duration: .9, ease: [.22, 1, .36, 1] })
      const visual = document.querySelector<HTMLElement>('[data-hero-visual]')
      if (visual) animate(visual, { opacity: [0, 1], scale: [.965, 1] }, { duration: 1, delay: .12, ease: [.22, 1, .36, 1] })
      document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((element) => {
        cleanups.push(inView(element, () => animate(element, { opacity: [0, 1], y: [28, 0] }, { duration: .7, ease: [.22, 1, .36, 1] }), { margin: '0px 0px -80px 0px' }))
      })
      document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((element) => {
        const move = (event: PointerEvent) => {
          const rect = element.getBoundingClientRect()
          const x = (event.clientX - rect.left) / rect.width - .5
          const y = (event.clientY - rect.top) / rect.height - .5
          element.style.transform = `perspective(900px) rotateX(${(-y * 3).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg) translateY(-4px)`
        }
        const leave = () => { element.style.transform = '' }
        element.addEventListener('pointermove', move)
        element.addEventListener('pointerleave', leave)
        cleanups.push(() => {
          element.removeEventListener('pointermove', move)
          element.removeEventListener('pointerleave', leave)
        })
      })
    }

    return () => {
      toggle?.removeEventListener('click', toggleMenu)
      closeButtons.forEach((button) => button.removeEventListener('click', closeMenu))
      links.forEach((link) => link.removeEventListener('click', closeMenu))
      cleanups.forEach((cleanup) => cleanup())
    }
  }, [])

  return null
}
