import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { GAME_CONFIG } from '../config/gameConfig'
import { auth, db, functions, isDemoMode, storage } from '../lib/firebase'
import type { SupportRequest, Supporter } from '../types'
import { compressSupportImage } from '../utils/compressImage'
import { demoStore } from './demo/demoStore'

export type SupportComposePayload = {
  message: string
  imageFile?: File
}

type SupportImageRef = {
  hasImage?: boolean
  imagePath?: string
}

export function isSupportAlertVisible(createdAt: Date, now = new Date()): boolean {
  const ttlMs = GAME_CONFIG.SUPPORT_REQUEST_COOLDOWN_HOURS * 60 * 60 * 1000
  return now.getTime() - createdAt.getTime() < ttlMs
}

export function supportImageStoragePath(campaignId: string, requestId: string, uid: string): string {
  return `campaigns/${campaignId}/supportRequests/${requestId}/supporters/${uid}.jpg`
}

export function supportRequestImageStoragePath(campaignId: string, requestId: string): string {
  return `campaigns/${campaignId}/supportRequests/${requestId}/request.jpg`
}

function createSupportRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `sr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function parseSupportContent(options: SupportComposePayload): { message: string; hasImage: boolean } {
  const message = options.message.trim().slice(0, GAME_CONFIG.SUPPORT_MESSAGE_MAX_LENGTH)
  const hasImage = Boolean(options.imageFile)
  if (!message && !hasImage) {
    throw new Error('Mensagem inválida')
  }
  return { message, hasImage }
}

function parseImageFields(data: Record<string, unknown>): Pick<SupportRequest, 'message' | 'hasImage' | 'imagePath'> {
  return {
    message: typeof data.message === 'string' ? data.message : '',
    hasImage: Boolean(data.hasImage),
    imagePath: typeof data.imagePath === 'string' ? data.imagePath : undefined,
  }
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
    ...parseImageFields(data),
  }
}

function parseSupporter(id: string, data: Record<string, unknown>): Supporter {
  return {
    id,
    userId: data.userId as string,
    nickname: data.nickname as string,
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate?.() ?? new Date(),
    ...parseImageFields(data),
    message: typeof data.message === 'string' ? data.message : '',
  }
}

async function uploadSupportJpeg(path: string, imageFile: File): Promise<string> {
  const compressed = await compressSupportImage(imageFile)
  if (isDemoMode) {
    return URL.createObjectURL(compressed)
  }
  if (!storage || !auth?.currentUser) throw new Error('Firebase não configurado')
  await uploadBytes(storageRef(storage, path), compressed, { contentType: 'image/jpeg' })
  return path
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

export async function createSupportRequest(
  campaignId: string,
  options: SupportComposePayload,
): Promise<SupportRequest> {
  const { message, hasImage } = parseSupportContent(options)
  const requestId = createSupportRequestId()
  let imagePath: string | undefined

  if (options.imageFile) {
    imagePath = await uploadSupportJpeg(
      supportRequestImageStoragePath(campaignId, requestId),
      options.imageFile,
    )
  }

  if (isDemoMode) {
    const player = demoStore.getCurrentPlayer()
    if (!player) throw new Error('Jogador não encontrado')
    return demoStore.createSupportRequest(player.id, {
      id: requestId,
      message,
      hasImage,
      imagePath,
    })
  }

  if (!functions) throw new Error('Firebase não configurado')
  const fn = httpsCallable(functions, 'createSupportRequest')
  const result = await fn({ campaignId, requestId, message, hasImage })
  return parseSupportRequest(
    (result.data as Record<string, unknown>).id as string,
    result.data as Record<string, unknown>
  )
}

export async function strengthenWarrior(
  campaignId: string,
  requestId: string,
  options: SupportComposePayload,
): Promise<Supporter> {
  const { message, hasImage } = parseSupportContent(options)
  let imagePath: string | undefined

  if (options.imageFile) {
    if (!isDemoMode && !auth?.currentUser) throw new Error('Firebase não configurado')
    const uid = auth?.currentUser?.uid ?? 'demo'
    imagePath = await uploadSupportJpeg(
      supportImageStoragePath(campaignId, requestId, uid),
      options.imageFile,
    )
  }

  if (isDemoMode) {
    const player = demoStore.getCurrentPlayer()
    if (!player) throw new Error('Jogador não encontrado')
    return demoStore.strengthen(requestId, player.id, player.nickname, message, { hasImage, imagePath })
  }

  if (!functions) throw new Error('Firebase não configurado')
  const fn = httpsCallable(functions, 'strengthenWarrior')
  const result = await fn({ campaignId, requestId, message, hasImage })
  return parseSupporter(
    (result.data as Record<string, unknown>).id as string,
    result.data as Record<string, unknown>
  )
}

export async function getSupportImageUrl(target: SupportImageRef): Promise<string> {
  if (!target.hasImage || !target.imagePath) {
    throw new Error('Imagem não encontrada')
  }
  if (isDemoMode) return target.imagePath
  if (!storage) throw new Error('Firebase não configurado')
  return getDownloadURL(storageRef(storage, target.imagePath))
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
