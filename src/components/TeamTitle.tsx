import React, { useEffect, useRef, useState } from 'react'
// 动效已按需停用，保留导入注释以便随时恢复
// import { animate, createDrawable, createSpring, createTimeline, splitText, stagger } from 'animejs'
import { useReducedMotion } from '../utils/motion'

type Props = {
  text?: string
}

/**
 * TeamTitle: Renders the team name with an animated SVG underline
 * using AnimeJS createDrawable(). Progressive enhancement: if
 * prefers-reduced-motion is set, the underline renders static.
 */
export default function TeamTitle({ text }: Props) {
  const reduced = useReducedMotion()
  const containerRef = useRef<HTMLHeadingElement | null>(null)
  const textRef = useRef<HTMLSpanElement | null>(null)
  const pathRef = useRef<SVGPathElement | null>(null)
  const animRef = useRef<any>(null)
  const tlRef = useRef<any>(null)
  const [ready, setReady] = useState(false)

  // Render text from env or prop
  const teamName = text ?? (import.meta.env.VITE_TEAM_NAME || '正规子群')

  // 动效停用：保留静态下划线，不进行路径绘制动画
  useEffect(() => {
    // no-op
  }, [reduced])

  // Split words and create an accessible separation effect (抽离感)
  // 动效停用：不对标题文本做分词/时间线抽离动画
  useEffect(() => {
    setReady(false)
  }, [reduced])

  const onToggleAccessible = () => {
    if (reduced) return
    const tl = tlRef.current
    if (!tl) return
    ;(tl as any).alternate().resume()
  }

  const retrigger = () => { /* 动效停用 */ }

  return (
    <h1
      ref={containerRef}
      className="title title-animated"
      /* 动效已停用：去除悬停重描 */
    >
      <span ref={textRef} className="title-text">{teamName}</span>
      {false && (
        <button
          type="button"
          className="title-a11y-btn"
          aria-label="切换可访问效果"
          onClick={onToggleAccessible}
        >
          A11y
        </button>
      )}
      {/* Decorative underline */}
      <svg className="title-ink" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="titleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: 'var(--math-teal)' }} />
            <stop offset="48%" style={{ stopColor: 'var(--math-violet)' }} />
            <stop offset="100%" style={{ stopColor: 'var(--math-gold)' }} />
          </linearGradient>
        </defs>
        {/* Slight wave underline spanning full width */}
        <path
          ref={pathRef}
          d="M2 8 C 28 2, 72 14, 98 8"
          fill="none"
          stroke="url(#titleGradient)"
          strokeWidth={2.5}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </h1>
  )
}
