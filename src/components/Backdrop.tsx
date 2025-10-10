import React, { useEffect, useRef } from 'react'
import { animate, spring } from 'animejs'
import { useReducedMotion } from '../utils/motion'

export default function Backdrop() {
  const reduced = useReducedMotion()
  // Feature flag: enable/disable spotlight effect via environment variable
  // Enabled by default; set VITE_ENABLE_SPOTLIGHT=false in .env to disable
  const spotlightEnabled = (import.meta as any).env?.VITE_ENABLE_SPOTLIGHT !== 'false'

  type SpotState = { x: number; y: number; scale: number; fade: number }
  const proxy = useRef<SpotState>({ x: 50, y: 20, scale: 1, fade: 1 }) // percentage + visual intensity
  const gridAnimRef = useRef<any>(null)

  useEffect(() => {
    const root = document.documentElement
    const updateCSS = () => {
      root.style.setProperty('--spot-x', proxy.current.x + '%')
      root.style.setProperty('--spot-y', proxy.current.y + '%')
      root.style.setProperty('--spot-scale', String(proxy.current.scale))
      root.style.setProperty('--spot-fade', String(proxy.current.fade))
    }
    updateCSS()

    // Subtle animated drift for dense background grid
    if (reduced) {
      root.style.setProperty('--grid-x', '0px')
      root.style.setProperty('--grid-y', '0px')
    } else {
      try {
        gridAnimRef.current = animate(root as any, {
          ['--grid-x' as any]: ['0px', '12px'],
          ['--grid-y' as any]: ['0px', '-12px'],
          duration: 80000,
          ease: 'linear',
          loop: true,
          // alternate to avoid jump when looping
          alternate: true,
        })
      } catch {}
    }

    // Early return if spotlight effect is disabled
    if (!spotlightEnabled) {
      return () => {
        try { gridAnimRef.current && gridAnimRef.current.pause && gridAnimRef.current.pause() } catch {}
      }
    }

    // --- Spotlight animation logic (only runs if enabled) ---
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100
      if (reduced) { proxy.current = { ...proxy.current, x, y }; updateCSS(); return }
      animate(proxy.current, { x, y, duration: 400, ease: 'easeOutQuad', onUpdate: updateCSS })
    }

    // Springs for natural-feel transitions (use spring() per Anime v4)
    const scatterSpring = spring({ mass: 1, stiffness: 70, damping: 14, velocity: 0 })
    const settleSpring = spring({ mass: 1, stiffness: 130, damping: 22, velocity: 0 })

    const relax = () => {
      // On blur/hidden: spotlight "散开" — expand radius and soften intensity
      const target = { scale: 5, fade: 0.24 }
      if (reduced) { proxy.current = { ...proxy.current, ...target }; updateCSS(); return }
      animate(proxy.current, { ...target, ease: scatterSpring, onUpdate: updateCSS })
    }
    const focusBack = () => {
      const target = { scale: 1, fade: 1 }
      if (reduced) { proxy.current = { ...proxy.current, ...target }; updateCSS(); return }
      animate(proxy.current, { ...target, ease: settleSpring, onUpdate: updateCSS })
    }

    const onBlur = () => relax()
    const onFocus = () => focusBack()
    const onVisChange = () => (document.hidden ? relax() : focusBack())

    window.addEventListener('mousemove', onMove)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisChange)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisChange)
      try { gridAnimRef.current && gridAnimRef.current.pause && gridAnimRef.current.pause() } catch {}
    }
  }, [reduced, spotlightEnabled])

  // Render nothing; background is drawn via body::after to avoid first-paint flicker
  return null
}
