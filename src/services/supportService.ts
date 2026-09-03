import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { GAME_CONFIG } from '../config/gameConfig'
import { db, functions, isDemoMode } from '../lib/firebase'
import type { SupportRequest, Supporter } from '../types'
import { demoStore } from './demo/demoStore'

export function isSupportAlertVisible(createdAt: Date, now = new Date()): boolean {
  const ttlMs = GAME_CONFIG.SUPPORT_REQUEST_COOLDOWN_HOURS * 60 * 60 * 1000
  return now.getTime() - createdAt.getTime() < ttlMs
}

function parseSupportRequest(id: string, data: Record<string, unknown>): SupportRequest {
  return {
    id,
    playerId: data.playerId as string,
    nickname: data.nickname as string,
    rank: data.rank as string,
    daysSurvived: data.daysSurvived as number,
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate?.() ?? new Date(),
    status: data.status as SupportRequest['status'],
    supporterCount: (data.supporterCount as number) ?? 0,
  }
}

function parseSupporter(id: string, data: Record<string, unknown>): Supporter {
  return {
    id,
    userId: data.userId as string,
    nickname: data.nickname as string,
    message: data.message as string,
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate?.() ?? new Date(),
  }
}

export function subscribeToSupportRequests(
  campaignId: string,
  callback: (requests: SupportRequest[]) => void
): () => void {
  if (isDemoMode) {
    callback(demoStore.getSupportRequests())
    return demoStore.subscribeSupport(() => callback(demoStore.getSupportRequests()))
  }

  if (!db) return () => {}
  const q = query(
    collection(db, 'campaigns', campaignId, 'supportRequests'),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => parseSupportRequest(d.id, d.data())))
  })
}

export function subscribeToSupporters(
  campaignId: string,
  requestId: string,
  callback: (supporters: Supporter[]) => void
): () => void {
  if (isDemoMode) {
    callback(demoStore.getSupporters(requestId))
    return demoStore.subscribeSupport(() => callback(demoStore.getSupporters(requestId)))
  }

  if (!db) return () => {}
  const q = collection(db, 'campaigns', campaignId, 'supportRequests', requestId, 'supporters')
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => parseSupporter(d.id, d.data())))
  })
}

export async function createSupportRequest(campaignId: string): Promise<SupportRequest> {
  if (isDemoMode) {
    const player = demoStore.getCurrentPlayer()
    if (!player) throw new Error('Jogador não encontrado')
    return demoStore.createSupportRequest(player.id)
  }

  if (!functions) throw new Error('Firebase não configurado')
  const fn = httpsCallable(functions, 'createSupportRequest')
  const result = await fn({ campaignId })
  return parseSupportRequest(
    (result.data as Record<string, unknown>).id as string,
    result.data as Record<string, unknown>
  )
}

export async function strengthenWarrior(
  campaignId: string,
  requestId: string,
  message: string
): Promise<Supporter> {
  if (isDemoMode) {
    const player = demoStore.getCurrentPlayer()
    if (!player) throw new Error('Jogador não encontrado')
    return demoStore.strengthen(requestId, player.id, player.nickname, message)
  }

  if (!functions) throw new Error('Firebase não configurado')
  const fn = httpsCallable(functions, 'strengthenWarrior')
  const result = await fn({ campaignId, requestId, message })
  return parseSupporter(
    (result.data as Record<string, unknown>).id as string,
    result.data as Record<string, unknown>
  )
}

export function getSupportCooldownRemaining(lastSupportRequestAt?: Date | null): number {
  if (isDemoMode) {
    const last = lastSupportRequestAt ?? demoStore.getLastSupportRequestAt()
    if (!last) return 0
    const remaining = 6 * 3600000 - (Date.now() - last.getTime())
    return Math.max(0, remaining)
  }
  if (!lastSupportRequestAt) return 0
  const remaining = 6 * 3600000 - (Date.now() - lastSupportRequestAt.getTime())
  return Math.max(0, remaining)
}
