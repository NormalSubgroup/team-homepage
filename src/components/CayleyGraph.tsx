import React, { useEffect, useRef } from 'react'

type CayleyGraphProps = {
  n?: number // number of elements in the group (cyclic C_n)
  generators?: number[] // generator steps mod n
  animate?: boolean
}

// Lightweight, dependency-free SVG-like canvas renderer for the Cayley graph of C_n
export default function CayleyGraph({ n = 8, generators = [1, Math.floor(8 / 2)], animate = true }: CayleyGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const rotationRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let running = true

    const setSize = () => {
      const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1))
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    setSize()

    // Neutral palette to match Apple/Vercel style
    const colors = ['#e5e5e5', '#a3a3a3', '#737373', '#525252']

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, width, height)
      const cx = width / 2
      const cy = height / 2
      const R = Math.min(cx, cy) - 12

      // subtle rotation for liveliness
      const theta0 = rotationRef.current

      // nodes
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(theta0)

      // edges per generator
      generators.forEach((g, gi) => {
        if (!Number.isFinite(g) || g === 0) return
        ctx.strokeStyle = colors[gi % colors.length]
        ctx.globalAlpha = 0.28
        ctx.lineWidth = 1.5
        ctx.beginPath()
        for (let i = 0; i < n; i++) {
          const a1 = (2 * Math.PI * i) / n
          const a2 = (2 * Math.PI * ((i + g) % n)) / n
          const x1 = R * Math.cos(a1)
          const y1 = R * Math.sin(a1)
          const x2 = R * Math.cos(a2)
          const y2 = R * Math.sin(a2)
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
        }
        ctx.stroke()
      })

      // nodes
      ctx.globalAlpha = 1
      for (let i = 0; i < n; i++) {
        const a = (2 * Math.PI * i) / n
        const x = R * Math.cos(a)
        const y = R * Math.sin(a)
        // halo
        const r = 18
        const grd = ctx.createRadialGradient(x, y, 0, x, y, r)
        grd.addColorStop(0, 'rgba(255,255,255,0.28)')
        grd.addColorStop(1, 'rgba(112,225,255,0)')
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
        // core
        ctx.fillStyle = '#fafafa'
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()
    }

    const step = () => {
      if (!running) return
      draw()
      if (animate) rotationRef.current += 0.0025
      rafRef.current = requestAnimationFrame(step)
    }

    step()

    const onResize = () => {
      setSize()
      draw()
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(canvas)

    return () => {
      running = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [n, generators.join(','), animate])

  return (
    <div className="cayley-wrap">
      <canvas ref={canvasRef} className="cayley-canvas" aria-label={`Cayley graph of C_${n}`} />
    </div>
  )
}
