import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore'
import { db, isDemoMode } from '../lib/firebase'
import type { FeedEvent } from '../types'
import { demoStore } from './demo/demoStore'

function parseFeedEvent(id: string, data: Record<string, unknown>): FeedEvent {
  return {
    id,
    type: data.type as FeedEvent['type'],
    playerId: data.playerId as string,
    nickname: data.nickname as string,
    data: (data.data as Record<string, unknown>) ?? {},
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate?.() ?? new Date(),
  }
}

export function subscribeToFeed(
  campaignId: string,
  callback: (events: FeedEvent[]) => void
): () => void {
  if (isDemoMode) {
    callback(demoStore.getFeed())
    return demoStore.subscribeFeed(() => callback(demoStore.getFeed()))
  }

  if (!db) return () => {}
  const q = query(
    collection(db, 'campaigns', campaignId, 'feed'),
    orderBy('createdAt', 'desc'),
    limit(50)
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => parseFeedEvent(d.id, d.data())))
  })
}

export function formatFeedMessage(event: FeedEvent): string {
  switch (event.type) {
    case 'JOINED':
      return `⚔️ ${event.nickname} entrou na batalha.`
    case 'CHECK_IN':
      return `🔥 ${event.nickname} sobreviveu ao dia ${event.data.day}.`
    case 'PROMOTION':
      return `🎖️ ${event.nickname} foi promovido a ${event.data.rank}.`
    case 'FALLEN':
      return `💀 ${event.nickname} caiu em combate no dia ${event.data.day}.`
    case 'TOP_3':
      return `🏆 ${event.nickname} alcançou o Top 3.`
    case 'MONK':
      return `∞ ${event.nickname} alcançou o estado de Monge.`
    case 'SUPPORT_REQUEST':
      return `🚨 ${event.nickname} pediu reforços.`
    default:
      return `${event.nickname} — evento desconhecido`
  }
}
