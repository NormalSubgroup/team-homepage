import React from 'react'
import katex from 'katex'
import CayleyGraph3D from './CayleyGraph3D'
import { useReducedMotion } from '../utils/motion'
import { Icon } from '@iconify/react'
import MemberCard from './MemberCard'
import members, { founder } from '../data/team'

type Props = {
  group?: 'Cn' | 'D4'
}

export default function GroupPanel({ group = 'Cn' }: Props) {
  const reduced = useReducedMotion()
  const alwaysSpin = (import.meta as any).env?.VITE_GRAPH_ALWAYS_SPIN !== 'false'
  const total = (members?.length || 0) + (founder ? 1 : 0)
  const [presentation, caption] = (() => {
    if (group === 'Cn') {
      return [
        String.raw`\mathbb{Z}_8 = \langle a \mid a^8 = e \rangle`,
        ''
      ] as const
    }
    // D4 presentation and a generic caption
    return [
      String.raw`D_4 = \langle r, s \mid r^4 = e,\ s^2 = e,\ srs = r^{-1} \rangle`,
      '二面体群 D₄ 的表示（示意）'
    ] as const
  })()
  const finalPresentation = group === 'Cn'
    ? `\\mathbb{Z}_{${total}} = \\langle a \\mid a^{${total}} = e \\rangle`
    : presentation

  return (
    <section className="group-section">
      <div className="panel group-info" role="group" aria-label="Group presentation">
        <div className="panel-head">
          <h3 className="panel-title">Group Presentation</h3>
          <nav className="badges" aria-label="Team links">
            <a
              className="badge badge-ctftime"
              href="https://ctftime.org/team/365958"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="CTFtime team"
              title="CTFtime"
            >
              <Icon icon="mdi:trophy" width={20} height={20} aria-hidden="true" />
              <span className="sr-only">CTFtime</span>
            </a>
            <a
              className="badge badge-github"
              href="https://github.com/NormalSubgroup"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub org"
              title="GitHub"
            >
              <Icon icon="simple-icons:github" width={20} height={20} aria-hidden="true" />
              <span className="sr-only">GitHub</span>
            </a>
            <a
              className="badge badge-blog"
              href="https://normalsubgroup.cauchy.top/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Team Blog"
              title="Blog"
            >
              <Icon icon="mdi:book-open-variant" width={20} height={20} aria-hidden="true" />
              <span className="sr-only">Blog</span>
            </a>
            <a
              className="badge badge-notion"
              href="https://www.notion.so/416913cdfdda42a78d7d26062f8bed9c"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Notion workspace"
              title="Notion"
            >
              <Icon icon="simple-icons:notion" width={20} height={20} aria-hidden="true" />
              <span className="sr-only">Notion</span>
            </a>
          </nav>
        </div>
        <div
          className="katex-block"
          ref={(el) => {
            if (!el) return
            try {
              katex.render(finalPresentation, el, { displayMode: true, throwOnError: false, strict: 'ignore' })
            } catch {}
          }}
        />
        {/* 空一行（第一个公式后） */}
        <div aria-hidden="true" style={{ height: '1em' }} />
        {caption && <p className="muted">{caption}</p>}
        <div
          className="katex-block"
          ref={(el) => {
            if (!el) return
            try {
              // 数学表达（无中文）：使用 \land 连接条件
              katex.render(String.raw`\langle S \rangle = \bigcap \{ H \mid S \subseteq H \land H \le G \}`, el, { displayMode: true, throwOnError: false, strict: 'ignore' })
            } catch {}
          }}
        />
        {/* 空一行（第二个公式后） */}
        <div aria-hidden="true" style={{ height: '1em' }} />
        <div
          className="katex-block"
          ref={(el) => {
            if (!el) return
            try {
              katex.render(String.raw`\langle S \rangle \quad \longleftrightarrow \quad \text{Group}`, el, { displayMode: true, throwOnError: false, strict: 'ignore' })
            } catch {}
          }}
        />
        <div
          className="katex-block"
          ref={(el) => {
            if (!el) return
            try {
              katex.render(String.raw`\{ H \mid S \subseteq H,\ H \le G \} \quad \longleftrightarrow \quad \{ \text{Crypto} \mid S \subseteq \text{Crypto} \le G \}`, el, { displayMode: true, throwOnError: false, strict: 'ignore' })
            } catch {}
          }}
        />
        <div
          className="katex-block"
          ref={(el) => {
            if (!el) return
            try {
              katex.render(String.raw`\text{Crypto}_{\text{graphy}} \quad \longleftrightarrow \quad H`, el, { displayMode: true, throwOnError: false, strict: 'ignore' })
            } catch {}
          }}
        />
        {/* Founder 不再单独展示，已放入成员列表的第一位 */}
      </div>

      <div className="panel group-graph" role="figure" aria-label="Cayley graph">
        <h3 className="panel-title">Cayley Graph</h3>
        {/* 3D-like projection via canvas + AnimeJS; labels by KaTeX */}
        <CayleyGraph3D
          n={Math.max(1, (members?.length || 0) + (founder ? 1 : 0))}
          generators={(members.length + (founder ? 1 : 0)) <= 2 ? [1] : [1, Math.max(1, Math.floor(((members?.length || 0) + (founder ? 1 : 0)) / 2))]}
          animate={!reduced || alwaysSpin}
          showLabels
        />
      </div>
    </section>
  )
}
