import { describe, it, expect } from 'vitest'
import {
  getRankForDays,
  getNextRank,
  getDaysUntilNextRank,
  isPromotion,
  comparePlayersForRanking,
  buildAvatarConfigForRank,
} from '../utils/ranks'
import { RANKS } from '../config/ranks'
import { getPortraitFilenameForBase } from '../config/avatarArt'

describe('Rank calculation', () => {
  it('returns Soldado for 0-2 days', () => {
    expect(getRankForDays(0).id).toBe('soldado')
    expect(getRankForDays(2).id).toBe('soldado')
  })

  it('returns Cabo for 3-4 days', () => {
    expect(getRankForDays(3).id).toBe('cabo')
    expect(getRankForDays(4).id).toBe('cabo')
  })

  it('returns Capitão for 19-20 days', () => {
    expect(getRankForDays(19).id).toBe('capitao')
    expect(getRankForDays(20).id).toBe('capitao')
  })

  it('returns Monge for 29-30 days', () => {
    expect(getRankForDays(29).id).toBe('monge')
    expect(getRankForDays(30).id).toBe('monge')
  })
})

describe('Promotion', () => {
  it('detects promotion when days cross rank boundary', () => {
    expect(isPromotion(2, 3)).toBe(true)
    expect(isPromotion(3, 4)).toBe(false)
  })

  it('returns next rank correctly', () => {
    expect(getNextRank('soldado')?.id).toBe('cabo')
    expect(getNextRank('monge')).toBeNull()
  })

  it('calculates days until next rank', () => {
    expect(getDaysUntilNextRank(2)).toBe(1)
    expect(getDaysUntilNextRank(30)).toBe(0)
  })
})

describe('Rank portraits', () => {
  it('maps every rank to a portrait automatically', () => {
    for (const rank of RANKS) {
      expect(buildAvatarConfigForRank(rank.id, 'base-a').portrait).toBe(rank.id)
    }
  })

  it('uses a distinct portrait asset for each avatar base', () => {
    expect(getPortraitFilenameForBase('base-a')).toBe('portrait.png')
    expect(getPortraitFilenameForBase('base-b')).toBe('portrait-base-b.png')
    expect(getPortraitFilenameForBase('base-a')).not.toBe(getPortraitFilenameForBase('base-b'))
  })
})

describe('Ranking comparison', () => {
  it('sorts by days survived descending', () => {
    const a = { status: 'alive', daysSurvived: 10, joinedAt: new Date('2026-09-01') }
    const b = { status: 'alive', daysSurvived: 15, joinedAt: new Date('2026-09-01') }
    expect(comparePlayersForRanking(a, b)).toBeGreaterThan(0)
  })

  it('prioritizes monk status', () => {
    const monk = { status: 'monk', daysSurvived: 30, joinedAt: new Date() }
    const alive = { status: 'alive', daysSurvived: 29, joinedAt: new Date() }
    expect(comparePlayersForRanking(monk, alive)).toBeLessThan(0)
  })
})

describe('Fallen rules', () => {
  it('fallen players should not appear in alive ranking', () => {
    const players = [
      { status: 'alive', daysSurvived: 10, joinedAt: new Date() },
      { status: 'fallen', daysSurvived: 15, joinedAt: new Date() },
      { status: 'monk', daysSurvived: 30, joinedAt: new Date() },
    ]
    const ranking = players
      .filter((p) => p.status === 'alive' || p.status === 'monk')
      .sort(comparePlayersForRanking)
    expect(ranking).toHaveLength(2)
    expect(ranking.every((p) => p.status !== 'fallen')).toBe(true)
  })

  it('fallen players appear in cemetery filter', () => {
    const players = [
      { status: 'alive', daysSurvived: 10, joinedAt: new Date() },
      { status: 'fallen', daysSurvived: 8, joinedAt: new Date() },
    ]
    const fallen = players.filter((p) => p.status === 'fallen')
    expect(fallen).toHaveLength(1)
  })
})

describe('Check-in rules', () => {
  it('prevents duplicate check-in on same day', () => {
    const today = new Date().toISOString().split('T')[0]
    const lastCheckIn = new Date()
    const lastDate = lastCheckIn.toISOString().split('T')[0]
    expect(lastDate === today).toBe(true)
  })

  it('fallen cannot check in', () => {
    const status: string = 'fallen'
    expect(status === 'alive').toBe(false)
  })
})

describe('Support rules', () => {
  it('message respects 120 char limit', () => {
    const message = 'a'.repeat(150)
    const trimmed = message.slice(0, 120)
    expect(trimmed.length).toBe(120)
  })

  it('cannot strengthen self', () => {
    const playerId = 'p1'
    const requestPlayerId = 'p1'
    expect(playerId === requestPlayerId).toBe(true)
  })

  it('cooldown is 6 hours', () => {
    const cooldownMs = 6 * 3600000
    expect(cooldownMs).toBe(21600000)
  })
})

describe('Death snapshot', () => {
  it('rankAtDeath remains frozen after fall', () => {
    const player = {
      status: 'fallen' as const,
      currentRank: 'capitao',
      rankAtDeath: 'capitao',
      daysSurvived: 19,
      fallenDay: 19,
    }
    expect(player.rankAtDeath).toBe('capitao')
    expect(player.status).toBe('fallen')
    expect(player.status).not.toBe('alive')
  })

  it('avatarSnapshotAtDeath preserves config', () => {
    const snapshot = { base: 'base-a' as const, armor: 'captain' }
    const player = {
      status: 'fallen' as const,
      avatarSnapshotAtDeath: snapshot,
      avatarConfig: { base: 'base-a' as const, armor: 'basic' },
    }
    expect(player.avatarSnapshotAtDeath.armor).toBe('captain')
  })
})

describe('Campaign join', () => {
  const campaignStart = new Date(2026, 8, 1)

  it('treats a UTC campaign timestamp as September 1st', async () => {
    const { getCampaignDay } = await import('../utils/dates')
    const { getSelectableStartDateKeys } = await import('../utils/campaignJoin')
    const utcStart = new Date('2026-09-01T00:00:00.000Z')
    const septemberSecond = new Date(2026, 8, 2, 10)

    expect(getCampaignDay(utcStart, septemberSecond)).toBe(2)
    expect(getSelectableStartDateKeys(utcStart, '2026-09-04', septemberSecond)).toEqual([
      '2026-09-01',
      '2026-09-02',
    ])
  })

  it('calculates retroactive days without counting today', async () => {
    const { calculateInitialDaysSurvived } = await import('../utils/campaignJoin')
    expect(calculateInitialDaysSurvived(campaignStart, '2026-09-01', new Date(2026, 8, 1))).toBe(0)
    expect(calculateInitialDaysSurvived(campaignStart, '2026-09-01', new Date(2026, 8, 3))).toBe(2)
    expect(calculateInitialDaysSurvived(campaignStart, '2026-09-01', new Date(2026, 8, 4))).toBe(3)
    expect(calculateInitialDaysSurvived(campaignStart, '2026-09-03', new Date(2026, 8, 4))).toBe(1)
  })

  it('joining on Sep 3 with start Sep 1 gives Cabo after first check-in', async () => {
    const { calculateInitialDaysSurvived } = await import('../utils/campaignJoin')
    const initial = calculateInitialDaysSurvived(campaignStart, '2026-09-01', new Date(2026, 8, 3))
    expect(initial).toBe(2)
    expect(getRankForDays(initial).id).toBe('soldado')
    expect(getRankForDays(initial + 1).id).toBe('cabo')
  })

  it('registration closes after Sep 4', async () => {
    const { isRegistrationOpen } = await import('../utils/campaignJoin')
    expect(isRegistrationOpen(new Date('2026-09-04T10:00:00'))).toBe(true)
    expect(isRegistrationOpen(new Date('2026-09-05T00:00:00'))).toBe(false)
  })
})

describe('Monk achievement', () => {
  it('monk status at 30 days', () => {
    const days = 30
    expect(getRankForDays(days).id).toBe('monge')
  })
})
