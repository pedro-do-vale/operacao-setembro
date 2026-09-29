import type { Campaign, CampaignPlayer, FeedEvent, SupportRequest } from '../types'
import { dateKeyToDayNumber, formatDateKey, getCampaignStartDateKey, shiftDateKey } from './dates'
import { getRankById, getRankForDays } from './ranks'

export interface JourneyEvent {
  id: string
  kind: 'fallen' | 'support' | 'personal'
  title: string
  detail?: string
  timestamp: Date
}

export function buildMonkJourney(campaign: Campaign, player: CampaignPlayer, players: CampaignPlayer[], feed: FeedEvent[], requests: SupportRequest[]) {
  const start = player.personalStartDate ?? getCampaignStartDateKey(campaign.startDate)
  const recordedAt = player.lastCheckIn?.getTime()
  const cutoff = recordedAt && Number.isFinite(recordedAt) ? recordedAt : Date.now()
  const days = Array.from({ length: 30 }, (_, index) => ({
    day: index + 1,
    date: shiftDateKey(start, index),
    rank: getRankForDays(index + 1),
    milestone: index === 0 || getRankForDays(index).id !== getRankForDays(index + 1).id,
    events: [] as JourneyEvent[],
  }))
  function add(event: JourneyEvent, date?: string) {
    if (!Number.isFinite(event.timestamp.getTime()) || event.timestamp.getTime() > cutoff) return
    const dateKey = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : formatDateKey(event.timestamp)
    const index = dateKeyToDayNumber(dateKey) - dateKeyToDayNumber(start)
    // Events between the final day and its confirmation belong to the closing chapter.
    if (index < 0) return
    days[Math.min(29, index)].events.push(event)
  }
  for (const event of feed) {
    if (event.type === 'FALLEN') add({ id: event.id, kind: 'fallen', title: `${event.nickname} caiu em combate`, detail: event.data.day ? `${event.data.day} dias sobrevividos` : undefined, timestamp: event.createdAt })
    else if (event.type === 'SUPPORT_REQUEST') {
      if (!requests.some(request => request.id === event.data.requestId)) add({ id: event.id, kind: 'support', title: `${event.nickname} pediu socorro`, timestamp: event.createdAt })
    } else if (event.playerId === player.id || event.playerId === player.userId) {
      let title = ''
      if (event.type === 'PROMOTION') {
        const rank = String(event.data.rank ?? '')
        const resolved = getRankById(rank)
        title = `Você foi promovido a ${resolved.id === rank ? resolved.name : rank}`
      } else if (event.type === 'JOINED') title = 'Você entrou na batalha'
      else if (event.type === 'TOP_3') title = 'Você chegou ao Top 3'
      else if (event.type === 'CHECK_IN') title = 'Você confirmou mais um dia de combate'
      else if (event.type === 'MONK') title = 'Você conquistou o estado de Monge'
      if (title) add({ id: event.id, kind: 'personal', title, timestamp: event.createdAt }, typeof event.data.date === 'string' ? event.data.date : undefined)
    }
  }
  for (const request of requests) add({ id: `support-${request.id}`, kind: 'support', title: `${request.nickname} pediu socorro`, detail: [request.message, request.hasImage ? 'Pedido com imagem.' : '', request.supporterCount ? `${request.supporterCount} guerreiros enviaram força.` : ''].filter(Boolean).join(' '), timestamp: request.createdAt })
  for (const fallen of players) {
    if (fallen.status !== 'fallen' || !fallen.fallenAt || feed.some(event => event.type === 'FALLEN' && event.playerId === fallen.id)) continue
    add({ id: `fallen-${fallen.id}`, kind: 'fallen', title: `${fallen.nickname} caiu em combate`, detail: fallen.epitaph ?? undefined, timestamp: fallen.fallenAt })
  }
  for (const day of days) day.events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime() || a.id.localeCompare(b.id))
  return days
}
