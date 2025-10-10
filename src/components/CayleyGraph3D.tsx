import React, { useEffect, useRef } from 'react'
import katex from 'katex'
import { animate } from 'animejs'
import { useReducedMotion } from '../utils/motion'
import members, { founder } from '../data/team'

type Props = {
  n?: number
  generators?: number[]
  animate?: boolean
  showLabels?: boolean
}

// 3D-like Cayley graph for C_n using 2D canvas + perspective projection
// Animation is driven by AnimeJS; labels are rendered via KaTeX.
export default function CayleyGraph3D({ n = 12, generators = [1, Math.floor(12 / 2)], animate: doAnimate = true, showLabels = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const layerRef = useRef<HTMLDivElement | null>(null)
  const labelsRef = useRef<HTMLDivElement[]>([])
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const animRef = useRef<any>(null)
  const stateRef = useRef({ yaw: 0, pitch: -0.35 })
  const dragRef = useRef({ active: false, x: 0, y: 0, vx: 0, vy: 0, t: 0 })
  const hoverRef = useRef<{ i: number | null; x: number; y: number }>({ i: null, x: 0, y: 0 })
  const pointerInsideRef = useRef(false)
  const reduced = useReducedMotion()
  // Allow overriding reduced-motion for auto spin via env
  const alwaysSpin = (import.meta as any).env?.VITE_GRAPH_ALWAYS_SPIN !== 'false'

  useEffect(() => {
    const canvas = canvasRef.current
    const layer = layerRef.current
    if (!canvas || !layer) return
    const ctx = canvas.getContext('2d')!

    // On touch devices, prevent the UA from hijacking gestures (panning/zooming)
    try { canvas.style.touchAction = 'none' } catch {}

    const setSize = () => {
      const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1))
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    setSize()

    // Init labels
    labelsRef.current.forEach((el) => el.remove())
    labelsRef.current = []
    if (showLabels) {
      for (let i = 0; i < n; i++) {
        const el = document.createElement('div')
        el.style.position = 'absolute'
        el.style.left = '0px'
        el.style.top = '0px'
        el.style.transform = 'translate(-50%, -50%)'
        el.style.pointerEvents = 'none'
        el.style.userSelect = 'none'
        el.style.color = 'inherit'
        el.style.opacity = '0.9'
        const label = i === 0 ? 'e' : `a^{${i}}`
        try {
          katex.render(label, el, { throwOnError: false, strict: 'ignore' })
        } catch {}
        layer.appendChild(el)
        labelsRef.current.push(el)
      }
    }
    // Init tooltip
    if (tooltipRef.current) {
      const tip = tooltipRef.current
      tip.style.position = 'absolute'
      tip.style.left = '0px'
      tip.style.top = '0px'
      tip.style.transform = 'translate(-50%, -100%)'
      tip.style.pointerEvents = 'none'
      tip.style.userSelect = 'none'
      tip.style.display = 'none'
      tip.style.zIndex = '999'
    }

    const base: Array<[number, number, number]> = []
    const R = 4.5
    for (let i = 0; i < n; i++) {
      const k = i + 0.5
      const phi = Math.acos(1 - (2 * k) / n)
      const theta = Math.PI * (1 + Math.sqrt(5)) * k
      const x = Math.sin(phi) * Math.cos(theta)
      const y = Math.cos(phi)
      const z = Math.sin(phi) * Math.sin(theta)
      base.push([x * R, y * R, z * R])
    }

    const rotY = (p: [number, number, number], yaw: number): [number, number, number] => {
      const [x, y, z] = p
      const cy = Math.cos(yaw), sy = Math.sin(yaw)
      return [x * cy + z * sy, y, -x * sy + z * cy]
    }
    const rotX = (p: [number, number, number], pitch: number): [number, number, number] => {
      const [x, y, z] = p
      const cx = Math.cos(pitch), sx = Math.sin(pitch)
      return [x, y * cx - z * sx, y * sx + z * cx]
    }

    const project = (x: number, y: number, z: number, w: number, h: number) => {
      const d = 12 // camera distance
      const f = d / Math.max(0.01, z + d)
      const scale = Math.min(w, h) * 0.1
      return { x: w / 2 + x * f * scale, y: h / 2 - y * f * scale, f, z }
    }

    const normalize = (v: [number, number, number]) => {
      const [x, y, z] = v
      const m = Math.hypot(x, y, z) || 1
      return [x / m, y / m, z / m] as [number, number, number]
    }
    const cross = (a: [number, number, number], b: [number, number, number]) => [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ] as [number, number, number]
    const dot = (a: [number, number, number], b: [number, number, number]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
    const rotateAroundAxis = (v: [number, number, number], axis: [number, number, number], angle: number) => {
      const [x, y, z] = v
      const [ux, uy, uz] = axis
      const c = Math.cos(angle), s = Math.sin(angle)
      return [
        x * (c + ux * ux * (1 - c)) + y * (ux * uy * (1 - c) - uz * s) + z * (ux * uz * (1 - c) + uy * s),
        x * (uy * ux * (1 - c) + uz * s) + y * (c + uy * uy * (1 - c)) + z * (uy * uz * (1 - c) - ux * s),
        x * (uz * ux * (1 - c) - uy * s) + y * (uz * uy * (1 - c) + ux * s) + z * (c + uz * uz * (1 - c)),
      ] as [number, number, number]
    }

    const draw = () => {
      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      ctx.clearRect(0, 0, w, h)
      // Sphere shading background
      const scale = Math.min(w, h) * 0.1
      const cx = w / 2, cy = h / 2, rr = scale * R
      const sphere = ctx.createRadialGradient(cx - rr * 0.3, cy - rr * 0.4, rr * 0.2, cx, cy, rr)
      sphere.addColorStop(0, 'rgba(255,255,255,0.10)')
      sphere.addColorStop(1, 'rgba(255,255,255,0.02)')
      ctx.fillStyle = sphere
      ctx.beginPath()
      ctx.arc(cx, cy, rr, 0, Math.PI * 2)
      ctx.fill()
      const pts: Array<{ x: number; y: number; f: number; z: number }> = []
      for (let i = 0; i < n; i++) {
        const p1 = rotY(base[i], stateRef.current.yaw)
        const p2 = rotX(p1, stateRef.current.pitch)
        pts.push(project(p2[0], p2[1], p2[2], w, h))
      }

      // Edges as great-circle arcs; only front hemisphere segments
      ctx.lineWidth = 1.2
      for (const g of generators) {
        if (!Number.isFinite(g) || g % n === 0) continue
        for (let i = 0; i < n; i++) {
          const j = (i + g) % n
          const vi = normalize(base[i])
          const vj = normalize(base[j])
          const axis = normalize(cross(vi, vj))
          let ang = Math.acos(Math.max(-1, Math.min(1, dot(vi, vj))))
          if (!Number.isFinite(ang) || ang === 0) continue
          const steps = Math.max(12, Math.min(64, Math.floor(ang * 18)))
          let started = false
          ctx.beginPath()
          for (let s = 0; s <= steps; s++) {
            const t = s / steps
            const v = rotateAroundAxis(vi, axis, ang * t)
            const p1 = rotY([v[0] * R, v[1] * R, v[2] * R], stateRef.current.yaw)
            const p2 = rotX(p1, stateRef.current.pitch)
            const P = project(p2[0], p2[1], p2[2], w, h)
            if (p2[2] >= 0) {
              const alpha = 0.12 + 0.25 * Math.max(0, Math.min(1, P.f))
              ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(3)})`
              if (!started) { ctx.moveTo(P.x, P.y); started = true } else { ctx.lineTo(P.x, P.y) }
            } else {
              if (started) { ctx.stroke(); started = false; ctx.beginPath() }
            }
          }
          if (started) ctx.stroke()
        }
      }

      // Nodes with hover highlight; behind hemisphere dimmed
      const usingPointer = pointerInsideRef.current
      const tx = usingPointer ? hoverRef.current.x : w / 2
      const ty = usingPointer ? hoverRef.current.y : h / 2
      let nearest = { i: -1 as number, d2: 1e9 }
      for (let i = 0; i < n; i++) {
        const p = pts[i]
        const dx = p.x - tx, dy = p.y - ty
        const d2 = dx * dx + dy * dy
        if (d2 < nearest.d2) nearest = { i, d2 }
      }
      const hoverIdx = dragRef.current.active ? -1 : (usingPointer && nearest.d2 > 36 ? -1 : nearest.i)
      hoverRef.current.i = hoverIdx >= 0 ? hoverIdx : null
      for (let i = 0; i < n; i++) {
        const p = pts[i]
        const behind = p.z < 0
        const r = i === hoverIdx ? 22 : 18
        const alpha0 = 0.12 + 0.35 * p.f
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r)
        grd.addColorStop(0, `rgba(255,255,255,${(behind ? 0.1 : alpha0).toFixed(3)})`)
        grd.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = behind ? 'rgba(250,250,250,0.5)' : '#fafafa'
        ctx.beginPath()
        ctx.arc(p.x, p.y, i === hoverIdx ? 5 : 4, 0, Math.PI * 2)
        ctx.fill()
      }

      // Labels
      if (showLabels) {
        for (let i = 0; i < n; i++) {
          const p = pts[i]
          const el = labelsRef.current[i]
          if (!el) continue
          el.style.left = `${p.x}px`
          el.style.top = `${p.y - 14}px`
          el.style.opacity = `${(p.z < 0 ? 0.3 : 0.85 + 0.15 * p.f).toFixed(2)}`
          el.style.zIndex = String(100 + Math.floor(p.f * 100))
          el.style.transform = `translate(-50%, -50%) scale(${i === hoverIdx ? 1.05 : 1})`
        }
      }

      // Tooltip content and positioning
      if (tooltipRef.current) {
        const tip = tooltipRef.current
        if (hoverIdx >= 0) {
          const p = pts[hoverIdx]
          tip.style.left = `${p.x}px`
          tip.style.top = `${p.y - 24}px`
          tip.style.opacity = `${(p.z < 0 ? 0.6 : 1)}`

          // Resolve member by order: 0 -> founder, others map to members[i-1]
          let labelText = ''
          if (hoverIdx === 0 && founder) {
            labelText = founder.id
          } else {
            const m = members[hoverIdx - 1]
            labelText = m ? m.id : (hoverIdx === 0 ? 'e' : `a^${hoverIdx}`)
          }
          tip.textContent = labelText
          tip.style.display = 'block'
        } else {
          tip.style.display = 'none'
        }
      }
    }

    draw()

    // V4 animate: linear yaw rotation; respect reduced-motion
    const startSpin = () => {
      if (!doAnimate || (reduced && !alwaysSpin)) return
      animRef.current = animate(stateRef.current, {
        yaw: stateRef.current.yaw + Math.PI * 2,
        duration: 30000,
        ease: 'linear',
        loop: true,
        onUpdate: draw,
      })
    }
    if (doAnimate && (!reduced || alwaysSpin)) startSpin()

    const ro = new ResizeObserver(() => { setSize(); draw() })
    ro.observe(canvas)

    // Interactions: drag to rotate with inertia; hover to highlight
    const onPointerDown = (e: { clientX: number; clientY: number }) => {
      dragRef.current.active = true
      dragRef.current.x = e.clientX
      dragRef.current.y = e.clientY
      dragRef.current.vx = 0
      dragRef.current.vy = 0
      dragRef.current.t = performance.now()
      if (animRef.current && typeof animRef.current.pause === 'function') animRef.current.pause()
    }
    const onPointerMove = (e: { clientX: number; clientY: number }) => {
      const rect = canvas.getBoundingClientRect()
      pointerInsideRef.current = true
      hoverRef.current.x = e.clientX - rect.left
      hoverRef.current.y = e.clientY - rect.top
      if (!dragRef.current.active) { draw(); return }
      const nx = e.clientX
      const ny = e.clientY
      const dx = nx - dragRef.current.x
      const dy = ny - dragRef.current.y
      const now = performance.now()
      const dt = Math.max(16, now - dragRef.current.t)
      dragRef.current.vx = dx / dt
      dragRef.current.vy = dy / dt
      dragRef.current.x = nx
      dragRef.current.y = ny
      dragRef.current.t = now
      stateRef.current.yaw += dx * 0.005
      stateRef.current.pitch = Math.max(-1.2, Math.min(1.2, stateRef.current.pitch + dy * 0.005))
      draw()
    }
    const onPointerUp = () => {
      if (!dragRef.current.active) return
      dragRef.current.active = false
      const { vx, vy } = dragRef.current
      if (Math.abs(vx) + Math.abs(vy) > 0.001 && (!reduced || alwaysSpin)) {
        const target = { yaw: stateRef.current.yaw + vx * 800, pitch: stateRef.current.pitch + vy * 800 }
        animate(stateRef.current, { ...target, duration: 1200, ease: 'easeOutCubic', onUpdate: draw })
          .then(() => startSpin())
      } else {
        startSpin()
      }
    }
    const onPointerLeave = () => {
      pointerInsideRef.current = false
      draw()
    }
    // Feature-detect pointer events; fallback to mouse/touch where missing
    const supportsPointer = typeof window !== 'undefined' && 'onpointerdown' in window
    const listeners: Array<() => void> = []
    if (supportsPointer) {
      canvas.addEventListener('pointerdown', onPointerDown as any)
      window.addEventListener('pointermove', onPointerMove as any)
      window.addEventListener('pointerup', onPointerUp as any)
      canvas.addEventListener('pointerleave', onPointerLeave)
      listeners.push(
        () => canvas.removeEventListener('pointerdown', onPointerDown as any),
        () => window.removeEventListener('pointermove', onPointerMove as any),
        () => window.removeEventListener('pointerup', onPointerUp as any),
        () => canvas.removeEventListener('pointerleave', onPointerLeave),
      )
    } else {
      // Mouse fallback
      const onMouseDown = (e: MouseEvent) => onPointerDown(e)
      const onMouseMove = (e: MouseEvent) => onPointerMove(e)
      const onMouseUp = () => onPointerUp()
      const onMouseLeave = () => onPointerLeave()
      canvas.addEventListener('mousedown', onMouseDown)
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
      canvas.addEventListener('mouseleave', onMouseLeave)
      listeners.push(
        () => canvas.removeEventListener('mousedown', onMouseDown),
        () => window.removeEventListener('mousemove', onMouseMove),
        () => window.removeEventListener('mouseup', onMouseUp),
        () => canvas.removeEventListener('mouseleave', onMouseLeave),
      )
      // Touch fallback (iOS/Safari pre-PointerEvents)
      const pointFromTouch = (e: TouchEvent) => {
        const t = e.touches[0] || e.changedTouches[0]
        return t ? { clientX: t.clientX, clientY: t.clientY } : { clientX: 0, clientY: 0 }
      }
      const onTouchStart = (e: TouchEvent) => { e.preventDefault(); onPointerDown(pointFromTouch(e)) }
      const onTouchMove = (e: TouchEvent) => { e.preventDefault(); onPointerMove(pointFromTouch(e)) }
      const onTouchEnd = (_e: TouchEvent) => { onPointerUp() }
      const onTouchCancel = (_e: TouchEvent) => { onPointerLeave() }
      canvas.addEventListener('touchstart', onTouchStart, { passive: false })
      window.addEventListener('touchmove', onTouchMove, { passive: false })
      window.addEventListener('touchend', onTouchEnd)
      canvas.addEventListener('touchcancel', onTouchCancel)
      listeners.push(
        () => canvas.removeEventListener('touchstart', onTouchStart),
        () => window.removeEventListener('touchmove', onTouchMove as any),
        () => window.removeEventListener('touchend', onTouchEnd as any),
        () => canvas.removeEventListener('touchcancel', onTouchCancel),
      )
    }

    return () => {
      ro.disconnect()
      if (animRef.current && typeof animRef.current.pause === 'function') animRef.current.pause()
      labelsRef.current.forEach((el) => el.remove())
      labelsRef.current = []
      // Remove whichever listeners were attached
      try { listeners.forEach((off) => off()) } catch {}
    }
  }, [n, generators.join(','), doAnimate, reduced, showLabels, alwaysSpin])

  return (
    <div className="cayley-wrap" style={{ position: 'relative' }}>
      <canvas ref={canvasRef} className="cayley-canvas" aria-label={`Cayley graph 3D of C_${n}`} />
      <div ref={layerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div ref={tooltipRef} className="cayley-tooltip" aria-hidden="true" />
      </div>
    </div>
  )
}
