export type CampaignStatus = 'upcoming' | 'active' | 'finished'
export type PlayerStatus = 'alive' | 'fallen' | 'monk'
export type SupportRequestStatus = 'active' | 'closed'

export type FeedEventType =
  | 'JOINED'
  | 'CHECK_IN'
  | 'PROMOTION'
  | 'FALLEN'
  | 'TOP_3'
  | 'MONK'
  | 'SUPPORT_REQUEST'

export type AvatarBase = 'base-a' | 'base-b'

export interface AvatarConfig {
  base: AvatarBase
  portrait?: string
  body?: string
  face?: string
  hair?: string
  legs?: string
  boots?: string
  torso?: string
  armor?: string
  belt?: string
  shoulders?: string
  cape?: string
  weapon?: string
  headgear?: string
  head?: string
  effects?: string[]
  appearance?: {
    skinTone?: string
    hairStyle?: string
    hairColor?: string
    beardStyle?: string
  }
}

export interface User {
  uid: string
  nickname: string
  avatarBase: AvatarBase
  createdAt: Date
}

export interface Campaign {
  id: string
  name: string
  year: number
  startDate: Date
  endDate: Date
  status: CampaignStatus
  registrationDeadline?: string
}

export interface CampaignPlayer {
  id: string
  userId: string
  nickname: string
  avatarBase: AvatarBase
  avatarConfig: AvatarConfig
  status: PlayerStatus
  joinedAt: Date
  personalStartDate: string | null
  daysSurvived: number
  currentRank: string
  lastCheckIn: Date | null
  lastSupportRequestAt?: Date | null
  fallenAt: Date | null
  fallenDay: number | null
  rankAtDeath: string | null
  avatarSnapshotAtDeath: AvatarConfig | null
  achievements: string[]
  epitaph: string | null
}

export interface CheckIn {
  id: string
  date: string
  createdAt: Date
}

export interface FeedEvent {
  id: string
  type: FeedEventType
  playerId: string
  nickname: string
  data: Record<string, unknown>
  createdAt: Date
}

export interface SupportRequest {
  id: string
  playerId: string
  nickname: string
  rank: string
  daysSurvived: number
  createdAt: Date
  status: SupportRequestStatus
  supporterCount?: number
}

export interface Supporter {
  id: string
  userId: string
  nickname: string
  message: string
  createdAt: Date
}

export interface RankDefinition {
  id: string
  name: string
  minDays: number
  maxDays: number
  icon: string
  description: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'
  unlocks: string[]
  avatarConfig: Partial<AvatarConfig>
}

export interface AchievementDefinition {
  id: string
  name: string
  icon: string
  description: string
  condition: (player: CampaignPlayer) => boolean
}
