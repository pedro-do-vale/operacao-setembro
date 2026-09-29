import { describe, expect, it } from 'vitest'
import { buildMonkJourney } from '../utils/monkJourney'
import { demoStore } from '../services/demo/demoStore'
import type { FeedEvent, SupportRequest } from '../types'

const campaign = demoStore.getCampaign()
const player = { ...demoStore.getPlayer('p6')!, personalStartDate: '2026-09-01', lastCheckIn: new Date('2026-10-01T12:00:00Z') }
function event(id: string, type: FeedEvent['type'], date: string, data = {}): FeedEvent {
  return { id, type, playerId: 'other', nickname: 'GUERREIRO', createdAt: new Date(date), data }
}

describe('Daily monk journey', () => {
  it('builds all thirty days with rank milestones, without inventing events', () => {
    const days = buildMonkJourney(campaign, player, [], [], [])
    expect(days).toHaveLength(30)
    expect(days[2]).toMatchObject({ day: 3, rank: { id: 'cabo' }, milestone: true })
    expect(days[28].rank.id).toBe('rei')
    expect(days[29].rank.id).toBe('monge')
    expect(days.every(day => day.events.length === 0)).toBe(true)
  })

  it('groups casualties in São Paulo time, not by the fallen player’s survival count', () => {
    const feed = [event('fall', 'FALLEN', '2026-09-10T01:00:00Z', { day: 4 })]
    const days = buildMonkJourney(campaign, player, [], feed, [])
    expect(days[8].events[0].title).toContain('caiu em combate')
    expect(days[3].events).toHaveLength(0)
  })

  it('keeps old events, closed requests and messages, deduplicating feed entries', () => {
    const request: SupportRequest = { id: 'help', playerId: 'other', nickname: 'GUERREIRO', createdAt: new Date('2026-09-12T12:00:00Z'), rank: 'cabo', daysSurvived: 3, status: 'closed', message: 'Preciso de força.', supporterCount: 2 }
    const feed = Array.from({ length: 65 }, (_, index) => event(`f${index}`, 'FALLEN', '2026-09-04T12:00:00Z'))
    feed.push(event('help-feed', 'SUPPORT_REQUEST', '2026-09-12T12:00:00Z', { requestId: 'help' }))
    feed.push(event('future', 'FALLEN', '2026-10-02T12:00:00Z'))
    const days = buildMonkJourney(campaign, player, [], feed, [request])
    expect(days[3].events).toHaveLength(65)
    expect(days[11].events).toHaveLength(1)
    expect(days[11].events[0].detail).toContain('Preciso de força.')
    expect(days.flatMap(day => day.events).some(item => item.id === 'future')).toBe(false)
  })

  it('uses explicit confirmation dates and excludes other players’ promotions', () => {
    const own = { ...event('own', 'PROMOTION', '2026-09-04T12:00:00Z', { rank: 'cabo', date: '2026-09-03' }), playerId: player.id }
    const other = event('other', 'PROMOTION', '2026-09-04T12:00:00Z', { rank: 'cabo' })
    const days = buildMonkJourney(campaign, player, [], [own, other], [])
    expect(days[2].events[0].title).toBe('Você foi promovido a Cabo')
    expect(days[3].events).toHaveLength(0)
  })
})
