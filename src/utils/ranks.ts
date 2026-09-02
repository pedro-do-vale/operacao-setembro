import { RANKS, RANK_BY_ID } from '../config/ranks'
import { RANK_ART_BY_ID } from '../config/avatarArt'
import type { RankDefinition } from '../types'

export function getRankForDays(days: number): RankDefinition {
  const rank = RANKS.find((r) => days >= r.minDays && days <= r.maxDays)
  return rank ?? RANKS[0]
}

export function getRankById(rankId: string): RankDefinition {
  return RANK_BY_ID[rankId] ?? RANKS[0]
}

export function getNextRank(currentRankId: string): RankDefinition | null {
  const index = RANKS.findIndex((r) => r.id === currentRankId)
  if (index === -1 || index >= RANKS.length - 1) return null
  return RANKS[index + 1]
}

export function getDaysUntilNextRank(days: number): number {
  const current = getRankForDays(days)
  const next = getNextRank(current.id)
  if (!next) return 0
  return next.minDays - days
}

export function getRankProgress(days: number): number {
  const current = getRankForDays(days)
  const range = current.maxDays - current.minDays + 1
  const progress = days - current.minDays + 1
  return Math.min(100, Math.round((progress / range) * 100))
}

export function isPromotion(oldDays: number, newDays: number): boolean {
  return getRankForDays(oldDays).id !== getRankForDays(newDays).id
}

export function buildAvatarConfigForRank(rankId: string, base: 'base-a' | 'base-b') {
  const rank = getRankById(rankId)
  return {
    base,
    ...rank.avatarConfig,
    portrait: RANK_ART_BY_ID[rank.id]?.portrait,
  }
}

export function comparePlayersForRanking(
  a: { status: string; daysSurvived: number; joinedAt: Date },
  b: { status: string; daysSurvived: number; joinedAt: Date }
): number {
  if (a.status === 'monk' && b.status !== 'monk') return -1
  if (b.status === 'monk' && a.status !== 'monk') return 1
  if (b.daysSurvived !== a.daysSurvived) return b.daysSurvived - a.daysSurvived
  return a.joinedAt.getTime() - b.joinedAt.getTime()
}
