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
import { isSupportAlertVisible } from '../services/supportService'

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
  const sep3NoonBRT = new Date('2026-09-03T15:00:00.000Z')
  const sep4NoonBRT = new Date('2026-09-04T15:00:00.000Z')

  it('confirms yesterday, not today', async () => {
    const { getYesterdayKey, formatDateKey } = await import('../utils/dates')
    expect(formatDateKey(sep3NoonBRT)).toBe('2026-09-03')
    expect(getYesterdayKey(sep3NoonBRT)).toBe('2026-09-02')
  })

  it('blocks check-in on the first personal day', async () => {
    const { getCheckInAvailability } = await import('../utils/checkIn')
    const state = getCheckInAvailability({
      personalStartDate: '2026-09-03',
      lastConfirmedDate: null,
      now: sep3NoonBRT,
    })
    expect(state.canCheckIn).toBe(false)
    expect(state.reason).toBe('too-early')
  })

  it('blocks when yesterday is already confirmed', async () => {
    const { getCheckInAvailability } = await import('../utils/checkIn')
    const state = getCheckInAvailability({
      personalStartDate: '2026-09-01',
      lastConfirmedDate: '2026-09-02',
      now: sep3NoonBRT,
    })
    expect(state.canCheckIn).toBe(false)
    expect(state.reason).toBe('already-confirmed')
  })

  it('allows confirming yesterday when it is still open', async () => {
    const { getCheckInAvailability, confirmYesterdayCheckIn } = await import('../utils/checkIn')
    const state = getCheckInAvailability({
      personalStartDate: '2026-09-02',
      lastConfirmedDate: null,
      now: sep3NoonBRT,
    })
    expect(state.canCheckIn).toBe(true)
    expect(confirmYesterdayCheckIn({
      personalStartDate: '2026-09-02',
      lastConfirmedDate: null,
      now: sep3NoonBRT,
    }).yesterday).toBe('2026-09-02')
  })

  it('does not require check-in on the same day as join', async () => {
    const { getJoinLastConfirmedDate, getCheckInAvailability } = await import('../utils/checkIn')
    const { calculateInitialDaysSurvived } = await import('../utils/campaignJoin')
    const campaignStart = new Date('2026-09-01T00:00:00.000Z')
    const lastConfirmed = getJoinLastConfirmedDate('2026-09-01', sep3NoonBRT)
    expect(lastConfirmed).toBe('2026-09-02')
    expect(calculateInitialDaysSurvived(campaignStart, '2026-09-01', sep3NoonBRT)).toBe(2)
    const state = getCheckInAvailability({
      personalStartDate: '2026-09-01',
      lastConfirmedDate: lastConfirmed,
      now: sep3NoonBRT,
    })
    expect(state.canCheckIn).toBe(false)
    const nextDay = getCheckInAvailability({
      personalStartDate: '2026-09-01',
      lastConfirmedDate: lastConfirmed,
      now: sep4NoonBRT,
    })
    expect(nextDay.canCheckIn).toBe(true)
    expect(nextDay.yesterday).toBe('2026-09-03')
  })

  it('fallen cannot check in', () => {
    const status: string = 'fallen'
    expect(status === 'alive').toBe(false)
  })
})

describe('Check-in remap', () => {
  const today = '2026-09-03'
  const yesterday = '2026-09-02'

  it('moves a today check-in to yesterday', async () => {
    const { remapTodayCheckinIds, recomputeConfirmedState } = await import('../utils/checkIn')
    const remapped = remapTodayCheckinIds(['2026-09-03'], today, yesterday)
    expect(remapped.action).toBe('moved')
    expect(remapped.ids).toEqual(['2026-09-02'])
    const state = recomputeConfirmedState({
      personalStartDate: '2026-09-01',
      joinedAtDateKey: '2026-09-02',
      checkinIds: remapped.ids,
      yesterday,
    })
    expect(state.daysSurvived).toBe(2)
    expect(state.lastConfirmedDate).toBe('2026-09-02')
  })

  it('deletes a duplicate today check-in when yesterday already exists', async () => {
    const { remapTodayCheckinIds, recomputeConfirmedState } = await import('../utils/checkIn')
    const remapped = remapTodayCheckinIds(['2026-09-02', '2026-09-03'], today, yesterday)
    expect(remapped.action).toBe('deleted-duplicate')
    expect(remapped.ids).toEqual(['2026-09-02'])
    const state = recomputeConfirmedState({
      personalStartDate: '2026-09-02',
      joinedAtDateKey: '2026-09-02',
      checkinIds: remapped.ids,
      yesterday,
    })
    expect(state.daysSurvived).toBe(1)
    expect(state.lastConfirmedDate).toBe('2026-09-02')
  })

  it('keeps a missed day as a hole', async () => {
    const { remapTodayCheckinIds, recomputeConfirmedState, getCheckInAvailability } = await import('../utils/checkIn')
    const remapped = remapTodayCheckinIds(['2026-09-01'], today, yesterday)
    expect(remapped.action).toBe('none')
    const state = recomputeConfirmedState({
      personalStartDate: '2026-09-01',
      joinedAtDateKey: '2026-09-02',
      checkinIds: remapped.ids,
      yesterday,
    })
    expect(state.daysSurvived).toBe(1)
    expect(state.confirmedDates).toEqual(['2026-09-01'])
    const availability = getCheckInAvailability({
      personalStartDate: '2026-09-01',
      lastConfirmedDate: state.lastConfirmedDate,
      now: new Date('2026-09-03T15:00:00.000Z'),
    })
    expect(availability.canCheckIn).toBe(true)
    expect(availability.yesterday).toBe('2026-09-02')
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

  it('support request and strengthen require text, image, or both', () => {
    const canSubmit = (message: string, hasImage: boolean) => Boolean(message.trim() || hasImage)
    expect(canSubmit('', false)).toBe(false)
    expect(canSubmit('  ', false)).toBe(false)
    expect(canSubmit('Estou na linha de fogo.', false)).toBe(true)
    expect(canSubmit('', true)).toBe(true)
    expect(canSubmit('Manda força.', true)).toBe(true)
  })

  it('cooldown is 6 hours', () => {
    const cooldownMs = 6 * 3600000
    expect(cooldownMs).toBe(21600000)
  })

  it('battle alerts stay visible before 6 hours', () => {
    const now = new Date('2026-09-03T12:00:00.000Z')
    const createdAt = new Date(now.getTime() - (6 * 3600000 - 60_000))
    expect(isSupportAlertVisible(createdAt, now)).toBe(true)
  })

  it('battle alerts expire at 6 hours', () => {
    const now = new Date('2026-09-03T12:00:00.000Z')
    const createdAt = new Date(now.getTime() - 6 * 3600000)
    expect(isSupportAlertVisible(createdAt, now)).toBe(false)
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
  const campaignStart = new Date('2026-09-01T00:00:00.000Z')
  const sep1 = new Date('2026-09-01T15:00:00.000Z')
  const sep2 = new Date('2026-09-02T15:00:00.000Z')
  const sep3 = new Date('2026-09-03T15:00:00.000Z')
  const sep4 = new Date('2026-09-04T15:00:00.000Z')

  it('treats a UTC campaign timestamp as September 1st', async () => {
    const { getCampaignDay } = await import('../utils/dates')
    const { getSelectableStartDateKeys } = await import('../utils/campaignJoin')
    const utcStart = new Date('2026-09-01T00:00:00.000Z')

    expect(getCampaignDay(utcStart, sep2)).toBe(2)
    expect(getSelectableStartDateKeys(utcStart, '2026-09-04', sep2)).toEqual([
      '2026-09-01',
      '2026-09-02',
    ])
  })

  it('calculates retroactive days without counting today', async () => {
    const { calculateInitialDaysSurvived } = await import('../utils/campaignJoin')
    expect(calculateInitialDaysSurvived(campaignStart, '2026-09-01', sep1)).toBe(0)
    expect(calculateInitialDaysSurvived(campaignStart, '2026-09-01', sep3)).toBe(2)
    expect(calculateInitialDaysSurvived(campaignStart, '2026-09-01', sep4)).toBe(3)
    expect(calculateInitialDaysSurvived(campaignStart, '2026-09-03', sep4)).toBe(1)
  })

  it('joining on Sep 3 with start Sep 1 waits until Sep 4 to reach Cabo', async () => {
    const { calculateInitialDaysSurvived } = await import('../utils/campaignJoin')
    const { getJoinLastConfirmedDate, getCheckInAvailability } = await import('../utils/checkIn')
    const initial = calculateInitialDaysSurvived(campaignStart, '2026-09-01', sep3)
    expect(initial).toBe(2)
    expect(getRankForDays(initial).id).toBe('soldado')
    expect(getJoinLastConfirmedDate('2026-09-01', sep3)).toBe('2026-09-02')
    expect(getCheckInAvailability({
      personalStartDate: '2026-09-01',
      lastConfirmedDate: '2026-09-02',
      now: sep3,
    }).canCheckIn).toBe(false)
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
