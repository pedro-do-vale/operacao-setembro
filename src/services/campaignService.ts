import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  limit,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions, isDemoMode } from '../lib/firebase'
import type { Campaign, CampaignPlayer, AvatarBase } from '../types'
import { demoStore } from './demo/demoStore'
import { buildAvatarConfigForRank } from '../utils/ranks'
import { GAME_CONFIG } from '../config/gameConfig'

const DEFAULT_CAMPAIGN_ID = GAME_CONFIG.DEFAULT_CAMPAIGN_ID

function toDate(value: unknown): Date {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate()
  }
  return new Date(value as string)
}

function parseCampaign(id: string, data: Record<string, unknown>): Campaign {
  return {
    id,
    name: data.name as string,
    year: data.year as number,
    startDate: toDate(data.startDate),
    endDate: toDate(data.endDate),
    status: data.status as Campaign['status'],
    registrationDeadline: data.registrationDeadline as string | undefined,
  }
}

async function fetchCampaignById(campaignId: string): Promise<Campaign | null> {
  if (!db) return null
  const snap = await getDoc(doc(db, 'campaigns', campaignId))
  if (!snap.exists()) return null
  const data = snap.data()
  if (data.status !== 'active') return null
  return parseCampaign(snap.id, data)
}

async function ensureDefaultCampaign(): Promise<void> {
  if (!functions) return
  const fn = httpsCallable(functions, 'ensureDefaultCampaign')
  await fn()
}

function parsePlayer(id: string, data: Record<string, unknown>): CampaignPlayer {
  return {
    id,
    userId: data.userId as string,
    nickname: data.nickname as string,
    avatarBase: data.avatarBase as AvatarBase,
    avatarConfig: data.avatarConfig as CampaignPlayer['avatarConfig'],
    status: data.status as CampaignPlayer['status'],
    joinedAt: (data.joinedAt as { toDate: () => Date })?.toDate?.() ?? new Date(data.joinedAt as string),
    personalStartDate: (data.personalStartDate as string) ?? null,
    daysSurvived: data.daysSurvived as number,
    currentRank: data.currentRank as string,
    lastCheckIn: data.lastCheckIn
      ? (data.lastCheckIn as { toDate: () => Date }).toDate?.() ?? new Date(data.lastCheckIn as string)
      : null,
    lastConfirmedDate: (data.lastConfirmedDate as string) ?? null,
    lastSupportRequestAt: data.lastSupportRequestAt
      ? (data.lastSupportRequestAt as { toDate: () => Date }).toDate?.() ??
        new Date(data.lastSupportRequestAt as string)
      : null,
    fallenAt: data.fallenAt
      ? (data.fallenAt as { toDate: () => Date }).toDate?.() ?? new Date(data.fallenAt as string)
      : null,
    fallenDay: (data.fallenDay as number) ?? null,
    rankAtDeath: (data.rankAtDeath as string) ?? null,
    avatarSnapshotAtDeath: (data.avatarSnapshotAtDeath as CampaignPlayer['avatarSnapshotAtDeath']) ?? null,
    achievements: (data.achievements as string[]) ?? [],
    epitaph: (data.epitaph as string) ?? null,
  }
}

export async function getActiveCampaign(): Promise<Campaign | null> {
  if (isDemoMode) return demoStore.getCampaign()

  if (!db) return null

  const q = query(collection(db, 'campaigns'), where('status', '==', 'active'), limit(1))
  const snap = await getDocs(q)
  if (!snap.empty) {
    return parseCampaign(snap.docs[0].id, snap.docs[0].data())
  }

  const byId = await fetchCampaignById(DEFAULT_CAMPAIGN_ID)
  if (byId) return byId

  try {
    await ensureDefaultCampaign()
    return fetchCampaignById(DEFAULT_CAMPAIGN_ID)
  } catch {
    return null
  }
}

export async function joinCampaign(
  campaignId: string,
  userId: string,
  nickname: string,
  avatarBase: AvatarBase,
  personalStartDate: string
): Promise<CampaignPlayer> {
  if (isDemoMode) return demoStore.joinCampaign(userId, nickname, avatarBase, personalStartDate)

  if (!functions) throw new Error('Firebase não configurado')
  const fn = httpsCallable(functions, 'joinCampaign')
  const result = await fn({ campaignId, nickname, avatarBase, personalStartDate })
  return parsePlayer(userId, result.data as Record<string, unknown>)
}

export async function getPlayer(campaignId: string, userId: string): Promise<CampaignPlayer | null> {
  if (isDemoMode) {
    const p = demoStore.getPlayers().find((pl) => pl.userId === userId)
    return p ?? null
  }

  if (!db) return null
  const snap = await getDoc(doc(db, 'campaigns', campaignId, 'players', userId))
  if (!snap.exists()) return null
  return parsePlayer(snap.id, snap.data())
}

export function subscribeToPlayers(
  campaignId: string,
  callback: (players: CampaignPlayer[]) => void
): () => void {
  if (isDemoMode) {
    callback(demoStore.getPlayers())
    return demoStore.subscribePlayers(() => callback(demoStore.getPlayers()))
  }

  if (!db) return () => {}
  const q = query(collection(db, 'campaigns', campaignId, 'players'))
  return onSnapshot(q, (snap) => {
    const players = snap.docs.map((d) => parsePlayer(d.id, d.data()))
    callback(players)
  })
}

export function subscribeToPlayer(
  campaignId: string,
  userId: string,
  callback: (player: CampaignPlayer | null) => void
): () => void {
  if (isDemoMode) {
    const update = () => {
      const p = demoStore.getPlayers().find((pl) => pl.userId === userId) ?? null
      callback(p)
    }
    update()
    return demoStore.subscribePlayers(update)
  }

  if (!db) return () => {}
  return onSnapshot(doc(db, 'campaigns', campaignId, 'players', userId), (snap) => {
    callback(snap.exists() ? parsePlayer(snap.id, snap.data()) : null)
  })
}

export async function performCheckIn(campaignId: string): Promise<{
  player: CampaignPlayer
  promoted: boolean
  newRank: string | null
}> {
  if (isDemoMode) {
    const player = demoStore.getCurrentPlayer()
    if (!player) throw new Error('Jogador não encontrado')
    return demoStore.performCheckIn(player.id)
  }

  if (!functions) throw new Error('Firebase não configurado')
  const fn = httpsCallable(functions, 'performCheckIn')
  const result = await fn({ campaignId })
  const data = result.data as Record<string, unknown>
  return {
    player: parsePlayer(data.userId as string, data.player as Record<string, unknown>),
    promoted: data.promoted as boolean,
    newRank: (data.newRank as string) ?? null,
  }
}

export async function declareFall(campaignId: string): Promise<CampaignPlayer> {
  if (isDemoMode) {
    const player = demoStore.getCurrentPlayer()
    if (!player) throw new Error('Jogador não encontrado')
    return demoStore.declareFall(player.id)
  }

  if (!functions) throw new Error('Firebase não configurado')
  const fn = httpsCallable(functions, 'declareFall')
  const result = await fn({ campaignId })
  return parsePlayer(
    (result.data as Record<string, unknown>).userId as string,
    (result.data as Record<string, unknown>).player as Record<string, unknown>
  )
}

export async function setEpitaph(campaignId: string, epitaph: string): Promise<void> {
  if (isDemoMode) {
    const player = demoStore.getCurrentPlayer()
    if (player) demoStore.setEpitaph(player.id, epitaph)
    return
  }

  if (!functions) throw new Error('Firebase não configurado')
  const fn = httpsCallable(functions, 'setEpitaph')
  await fn({ campaignId, epitaph })
}

export function getInitialAvatarConfig(avatarBase: AvatarBase) {
  return buildAvatarConfigForRank('soldado', avatarBase)
}
