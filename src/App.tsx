import React from 'react'
import members, { founder } from './data/team'
import MemberCard from './components/MemberCard'
import type { UserProfile } from './types'
import Backdrop from './components/Backdrop'
import GridSizer from './components/GridSizer'
import Logo from './components/Logo'
import TeamTitle from './components/TeamTitle'
import GroupPanel from './components/GroupPanel'

export default function App() {
  const year = new Date().getFullYear()
  const yearText = year <= 2024 ? '2024' : `2024–${year}`

  return (
    <div className="page">
      <Backdrop />
      <header className="hero">
        <div className="brand">
          <Logo />
          <TeamTitle />
        </div>
        <p className="subtitle">Vite · Rollup · Bun · React · AnimeJS</p>
      </header>

      <main className="container">
        <GroupPanel />
        <h2 className="section-title">成员 Members</h2>
        <GridSizer ideal={300} min={240} gap={18}>
          {((founder ? [founder, ...members] : members) as UserProfile[]).map((m, i) => (
            <MemberCard key={m.id} member={m} index={i} />
          ))}
        </GridSizer>
      </main>

      <footer className="footer">
        <span>© {yearText}, 正规子群 / Normal Subgroup</span>
      </footer>
    </div>
  )
}
