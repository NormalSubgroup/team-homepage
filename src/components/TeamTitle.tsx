import React, { useEffect, useRef, useState } from 'react'
import { animate, createDrawable, createSpring, createTimeline, splitText, stagger } from 'animejs'
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
  const animRef = useRef<ReturnType<typeof animate> | null>(null)
  const tlRef = useRef<ReturnType<typeof createTimeline> | null>(null)
  const [ready, setReady] = useState(false)

  // Render text from env or prop
  const teamName = text ?? (import.meta.env.VITE_TEAM_NAME || '正规子群')

  useEffect(() => {
    if (!pathRef.current) return

    // Build a drawable proxy for the underline path
    const [drawable] = createDrawable(pathRef.current, 0, 0)

    // Cancel any previous animation
    if (animRef.current) {
      try { animRef.current.pause && animRef.current.pause() } catch {}
      animRef.current = null
    }

    // Reduced motion: render fully drawn
    if (reduced) {
      drawable.setAttribute('draw', '0 1')
      return
    }

    // Use springs for a lively stroke motion
    const springIn = createSpring({ mass: 1, stiffness: 140, damping: 18 })
    const springOut = createSpring({ mass: 1, stiffness: 80, damping: 16 })

    // Draw in, hold, then retract slightly and redraw (subtle loop)
    animRef.current = animate(drawable, {
      duration: 1400,
      ease: springIn,
      draw: ['0 0', '0 1'],
      direction: 'normal',
      autoplay: true,
      onComplete: () => {
        // Gentle echo pass
        animate(drawable, {
          duration: 900,
          ease: springOut,
          draw: ['0.08 0.92', '0 1']
        })
      }
    })

    return () => {
      if (animRef.current) {
        try { animRef.current.pause && animRef.current.pause() } catch {}
        animRef.current = null
      }
    }
  }, [reduced])

  // Split words and create an accessible separation effect (抽离感)
  useEffect(() => {
    const $text = textRef.current
    const $container = containerRef.current
    if (!$text || !$container) return

    // Clear previous timeline
    if (tlRef.current) {
      try { (tlRef.current as any).pause && (tlRef.current as any).pause() } catch {}
      tlRef.current = null
    }

    const splitter = splitText($text, { words: true, includeSpaces: true, accessible: true, debug: false })
    const $accessible = splitter.$target.firstChild as HTMLElement | null

    // Prepare 3D space
    $container.style.perspective = '900px'
    $container.style.transformStyle = 'preserve-3d'
    $text.style.display = 'inline-block'
    $text.style.willChange = 'transform'

    if ($accessible) {
      // Override visually-hidden defaults to become a visible overlay layer
      $accessible.style.cssText = [
        'opacity: 0',
        'position: absolute',
        'left: 0',
        'top: 0',
        'width: 100%',
        'height: 100%',
        'color: var(--math-teal)',
        'outline: currentColor dotted 1px',
        'pointer-events: none',
        'white-space: nowrap',
        'will-change: transform, opacity',
      ].join(';')
    }

    if (reduced) {
      if ($accessible) {
        $accessible.style.opacity = '1'
        ;($accessible.style as any).transform = 'translateZ(-1rem)'
      }
      splitter.words.forEach((w: HTMLElement) => {
        w.style.opacity = '0.9'
        ;(w.style as any).transform = 'translateZ(3rem)'
      })
      setReady(true)
      return () => {
        try { splitter.revert() } catch {}
      }
    }

    const tl = createTimeline({ defaults: { ease: 'inOutQuad', duration: 800 } })
    if ($accessible) tl.add($accessible, { opacity: 1, z: '-2rem' }, 0)
    tl.add($text, { rotateX: 0, rotateY: 60 }, 0)
    tl.add(splitter.words as unknown as HTMLElement[], {
      z: '6rem',
      opacity: 0.85,
      outlineColor: { from: '#FFF0' },
      duration: 750,
      delay: stagger(40, { from: 'random' })
    }, 0)
    tlRef.current = tl
    setReady(true)

    return () => {
      try { tlRef.current && (tlRef.current as any).pause && (tlRef.current as any).pause() } catch {}
      tlRef.current = null
      try { splitter.revert() } catch {}
    }
  }, [reduced])

  const onToggleAccessible = () => {
    if (reduced) return
    const tl = tlRef.current
    if (!tl) return
    ;(tl as any).alternate().resume()
  }

  const retrigger = () => {
    // Re-run the animation on hover/focus if motion is allowed
    if (reduced || !pathRef.current) return
    const [drawable] = createDrawable(pathRef.current, 0, 0)
    animate(drawable, { duration: 900, draw: ['0 0', '0 1'], ease: 'out(2)' })
  }

  return (
    <h1
      ref={containerRef}
      className="title title-animated"
      onMouseEnter={retrigger}
      /* Do not add keyboard focusability to headings; keep semantics simple */
    >
      <span ref={textRef} className="title-text">{teamName}</span>
      {ready && (
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
