import React, { useLayoutEffect, useRef } from 'react'

type Props = {
  children: React.ReactNode
  innerRef?: React.Ref<HTMLDivElement>
  gap?: number // px
  ideal?: number // px ideal card width
  min?: number // px minimum card width
  maxCols?: number
}

export default function GridSizer({ children, innerRef, gap = 18, ideal = 300, min = 240, maxCols = 12 }: Props) {
  const gridRef = useRef<HTMLDivElement | null>(null)

  function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
    if (!ref) return
    if (typeof ref === 'function') return ref(value as T)
    ;(ref as React.MutableRefObject<T | null>).current = value
  }

  useLayoutEffect(() => {
    const el = gridRef.current
    if (!el) return

    const compute = () => {
      const width = el.clientWidth
      if (width <= 0) return
      let cols = Math.max(1, Math.floor((width + gap) / (ideal + gap)))
      cols = Math.min(Math.max(1, cols), maxCols)

      // Ensure card width is not below min by adjusting cols downward
      const cardW = (width - (cols - 1) * gap) / cols
      if (cardW < min && cols > 1) {
        cols = Math.max(1, Math.floor((width + gap) / (min + gap)))
      }

      el.style.setProperty('--cols', String(cols))
      el.style.setProperty('--gap', gap + 'px')
      // card width and height are computed in CSS from cols & gap
    }

    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [gap, ideal, min, maxCols])

  return (
    <div ref={(node) => { gridRef.current = node; assignRef(innerRef, node) }} className="grid">
      {children}
    </div>
  )
}
