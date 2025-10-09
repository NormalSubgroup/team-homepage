export type MemberRole = 'founder' | 'member'

// Minimal shape used across UI for a person
export type UserProfile = {
  id: string
  avatar: string
  introduction: string
  links: string[]
}

// Raw team record from data source (JSON)
export type TeamRecord = UserProfile & {
  role?: MemberRole
}

// Strongly-typed founder profile
export type FounderProfile = UserProfile & { role: 'founder' }
