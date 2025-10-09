import type { UserProfile, TeamRecord, FounderProfile } from '../types'
import raw from './team.json'

function isString(x: unknown): x is string {
  return typeof x === 'string'
}

function isTeamRecord(x: unknown): x is TeamRecord {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  const base = (
    isString(o.id) &&
    isString(o.avatar) &&
    isString(o.introduction) &&
    Array.isArray(o.links) && o.links.every(isString)
  )
  if (!base) return false
  if (typeof o.role === 'undefined') return true
  return o.role === 'founder' || o.role === 'member'
}

let founder: FounderProfile | null = null
let members: UserProfile[] = []

if (Array.isArray(raw)) {
  const records = (raw as unknown[]).filter(isTeamRecord) as TeamRecord[]

  if (import.meta.env.DEV) {
    const invalid = (raw as unknown[]).filter((v) => !isTeamRecord(v))
    if (invalid.length) {
      console.warn('[data/team] Invalid team records filtered:', invalid)
    }
  }

  const f = records.find((r) => r.role === 'founder')
  if (f) founder = { ...f, role: 'founder' }

  members = records
    .filter((r) => r.role !== 'founder')
    .map(({ id, avatar, introduction, links }) => ({ id, avatar, introduction, links }))
} else {
  if (import.meta.env.DEV) {
    console.warn('[data/team] team.json is not an array')
  }
}

export { founder }
export default members
