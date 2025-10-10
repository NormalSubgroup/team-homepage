import React, { useRef } from 'react'
import type { UserProfile } from '../types'
import { animate } from 'animejs'
import { useReducedMotion } from '../utils/motion'

type Props = {
  member: UserProfile
  index: number
  wide?: boolean
}

export default function MemberCard({ member, index, wide = false }: Props) {
  const reduced = useReducedMotion()
  // const [flipped, setFlipped] = useState(false) // disabled: flip trick commented out
  const cardRef = useRef<HTMLElement | null>(null)
  // const avatarWrapRef = useRef<HTMLDivElement | null>(null) // disabled: no avatar glow layer
  const innerRef = useRef<HTMLDivElement | null>(null)
  const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const triedProxy = img.dataset.pixivFallback === '1'
    // If the source is a Pixiv CDN URL, attempt a proxy domain once
    try {
      const u = new URL(img.src)
      if (!triedProxy && /(^|\.)i\.pximg\.net$/i.test(u.hostname)) {
        img.dataset.pixivFallback = '1'
        img.src = img.src.replace('//i.pximg.net/', '//i.pixiv.re/')
        return
      }
    } catch {}
    // Final fallback: 1x1 transparent gif to preserve layout
    img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACw='
  }
  // const toggleFlip = () => setFlipped((v) => !v) // disabled: no flip
  const onMove = (e: React.MouseEvent) => {
    if (reduced) return
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    const rotateX = py * -10
    const rotateY = px * 12
    animate(el as any, { rotateX, rotateY, duration: 180, ease: 'easeOutQuad' })
  }
  const onLeave = () => {
    const el = cardRef.current
    if (!el) return
    animate(el as any, { rotateX: 0, rotateY: 0, duration: 250, ease: 'easeOutCubic' })
  }
  type CSSVars = React.CSSProperties & Record<string, string | number>
  return (
    <article
      ref={cardRef}
      // className includes no flip state now
      className={`card${wide ? ' wide' : ''}`}
      // Safer CSS url() value to avoid accidental injection via quotes/parentheses
      style={{ ['--avatar-bg']: cssUrl(member.avatar) } as CSSVars}
      data-index={index}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div
        ref={innerRef}
        className="card-inner"
        // onClick={toggleFlip}
        // role="button"
        // aria-pressed={flipped}
        // tabIndex={0}
        // onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggleFlip())}
      >
        <div className="card-face card-front">
          <div
            className="avatar-wrap"
            // ref={avatarWrapRef}
            // style={{ ['--avatar-url' as any]: `url("${member.avatar}")` }}
          >
            <img
              className="avatar"
              src={member.avatar}
              alt={`${member.id} avatar`}
              loading="lazy"
              decoding="async"
              width={72}
              height={72}
              referrerPolicy="no-referrer"
              onError={onImgError}
            />
          </div>
          <div className="meta">
            <h3 className="name">{member.id}</h3>
            {/* 交换位置：先展示 Blog（links），再展示签名（intro） */}
            <div className="links">
              {member.links.map((url, i) => {
                let label = url
                try {
                  label = new URL(url).hostname
                } catch {}
                return (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="link">
                    {label}
                  </a>
                )
              })}
            </div>
          </div>
          {/* 将签名移动到头像下方，并跨两列显示，左侧缩进 8px */}
          <p
            className="intro"
            style={{ gridColumn: '1 / -1', marginLeft: 2 }}
            title={member.introduction}
          >
            {member.introduction}
          </p>
        </div>
        {/**
         * Flip back face disabled by request.
         *
         * <div className="card-face card-back">
         *   <h3 className="name">{member.id}</h3>
         *   <p className="intro" style={{ marginBottom: 12 }}>{member.introduction}</p>
         *   <div className="links back-links">
         *     {member.links.map((url, i) => (
         *       <a key={i} href={url} target="_blank" rel="noreferrer" className="link strong">
         *         {url}
         *       </a>
         *     ))}
         *   </div>
         *   <span className="hint">点击翻面 / Click to flip</span>
         * </div>
         */}
      </div>
    </article>
  )
}

// Helper to safely build a CSS url(...) value
function cssUrl(raw: string): string {
  // Basic neutralization of characters that could break out of url("...")
  const safe = String(raw).replace(/"/g, '\\"').replace(/\)/g, '\\)')
  return `url("${safe}")`
}
