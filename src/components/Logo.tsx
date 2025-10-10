import React, { useEffect, useRef } from 'react'
import katex from 'katex'

type LogoProps = {
  formula?: string
}

export default function Logo({ formula }: LogoProps) {
  const elRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!elRef.current) return
    const expr = formula ?? String.raw`\text{Group} = \bigcap_{S \subseteq \text{Crypto} \le G} \text{Crypto}_{\text{graphy}}`
    try {
      katex.render(expr, elRef.current, {
        displayMode: true,
        throwOnError: false,
        strict: 'ignore'
      })
    } catch (e) {
      // no-op, keep empty on error
    }
  }, [formula])

  const teamName = import.meta.env.VITE_TEAM_NAME || '正规子群'

  return (
    <div className="logo" aria-hidden="true" title={teamName}>
      <div ref={elRef} className="katex-logo" />
    </div>
  )
}
