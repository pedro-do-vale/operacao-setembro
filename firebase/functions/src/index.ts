import * as admin from 'firebase-admin'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

admin.initializeApp()
const db = admin.firestore()

const RANKS = [
  { id: 'soldado', minDays: 0, maxDays: 2 },
  { id: 'cabo', minDays: 3, maxDays: 4 },
  { id: '3-sargento', minDays: 5, maxDays: 6 },
  { id: '2-sargento', minDays: 7, maxDays: 8 },
  { id: '1-sargento', minDays: 9, maxDays: 10 },
  { id: 'subtenente', minDays: 11, maxDays: 12 },
  { id: 'aspirante', minDays: 13, maxDays: 14 },
  { id: '2-tenente', minDays: 15, maxDays: 16 },
  { id: '1-tenente', minDays: 17, maxDays: 18 },
  { id: 'capitao', minDays: 19, maxDays: 20 },
  { id: 'major', minDays: 21, maxDays: 22 },
  { id: 'coronel', minDays: 23, maxDays: 24 },
  { id: 'general', minDays: 25, maxDays: 26 },
  { id: 'rei', minDays: 27, maxDays: 28 },
  { id: 'monge', minDays: 29, maxDays: 30 },
]

const RANK_AVATAR_CONFIG: Record<string, Record<string, unknown>> = {
  soldado: { portrait: 'soldado', armor: 'basic' },
  cabo: { portrait: 'cabo', armor: 'basic' },
  '3-sargento': { portrait: '3-sargento', armor: 'sergeant', shoulders: 'basic' },
  '2-sargento': { portrait: '2-sargento', armor: 'sergeant', shoulders: 'basic' },
  '1-sargento': { portrait: '1-sargento', armor: 'sergeant', shoulders: 'basic', weapon: 'sword-basic' },
  subtenente: { portrait: 'subtenente', armor: 'officer', shoulders: 'basic' },
  aspirante: { portrait: 'aspirante', armor: 'officer', shoulders: 'basic', cape: 'basic' },
  '2-tenente': { portrait: '2-tenente', armor: 'officer', cape: 'basic', weapon: 'sword-officer' },
  '1-tenente': { portrait: '1-tenente', armor: 'officer', cape: 'officer', weapon: 'sword-officer' },
  capitao: { portrait: 'capitao', armor: 'captain', cape: 'officer', weapon: 'sword-officer' },
  major: { portrait: 'major', armor: 'captain', cape: 'officer', weapon: 'sword-officer', effects: ['stars'] },
  coronel: { portrait: 'coronel', armor: 'captain', shoulders: 'elite', cape: 'officer', weapon: 'sword-officer', effects: ['stars'] },
  general: { portrait: 'general', armor: 'general', shoulders: 'elite', cape: 'royal', weapon: 'sword-legendary', head: 'general-helmet', effects: ['stars'] },
  rei: { portrait: 'rei', armor: 'general', shoulders: 'elite', cape: 'royal', weapon: 'sword-legendary', head: 'crown', effects: ['stars'] },
  monge: { portrait: 'monge', armor: 'general', cape: 'royal', weapon: 'sword-legendary', effects: ['monk-aura', 'aura'] },
}

const SUPPORT_COOLDOWN_MS = 6 * 60 * 60 * 1000
const DEFAULT_REGISTRATION_DEADLINE = '2026-09-04'
const DEFAULT_CAMPAIGN_ID = 'operacao-setembro-2026'
const REPAIR_ALLOWLIST = ['pedroduartedovale@gmail.com']

function getRankForDays(days: number) {
  return RANKS.find((r) => days >= r.minDays && days <= r.maxDays) ?? RANKS[0]
}

function formatDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const value = (type: 'year' | 'month' | 'day') =>
    parts.find((part) => part.type === type)?.value ?? ''
  return `${value('year')}-${value('month')}-${value('day')}`
}

function getCampaignStartDateKey(startDate: Date): string {
  return startDate.toISOString().slice(0, 10)
}

function dateKeyToDayNumber(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number)
  return Math.floor(Date.UTC(year, month - 1, day) / (1000 * 60 * 60 * 24))
}

function shiftDateKey(dateKey: string, days: number): string {
  const shifted = new Date((dateKeyToDayNumber(dateKey) + days) * 24 * 60 * 60 * 1000)
  const y = shifted.getUTCFullYear()
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0')
  const d = String(shifted.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function dateKeysInclusive(fromKey: string, toKey: string): string[] {
  if (fromKey > toKey) return []
  const keys: string[] = []
  let current = fromKey
  while (current <= toKey) {
    keys.push(current)
    current = shiftDateKey(current, 1)
  }
  return keys
}

function recomputeConfirmedState(params: {
  personalStartDate: string
  joinedAtDateKey: string
  checkinIds: string[]
  yesterday: string
}) {
  const dayBeforeJoin = shiftDateKey(params.joinedAtDateKey, -1)
  const autoGranted = dateKeysInclusive(params.personalStartDate, dayBeforeJoin)
  const checkins = params.checkinIds.filter(
    (id) => id <= params.yesterday && id >= params.personalStartDate
  )
  const confirmedDates = [...new Set([...autoGranted, ...checkins])].sort()
  return {
    daysSurvived: confirmedDates.length,
    lastConfirmedDate: confirmedDates[confirmedDates.length - 1] ?? null,
  }
}

function getCampaignDay(startDate: Date, referenceDate: Date): number {
  const startDay = dateKeyToDayNumber(getCampaignStartDateKey(startDate))
  const referenceDay = dateKeyToDayNumber(formatDateKey(referenceDate))
  const diff = referenceDay - startDay
  return Math.max(1, Math.min(30, diff + 1))
}

function calculateInitialDaysSurvived(campaignStart: Date, personalStartDateKey: string, now = new Date()) {
  const startDay = dateKeyToDayNumber(getCampaignStartDateKey(campaignStart))
  const personalDay = dateKeyToDayNumber(personalStartDateKey) - startDay + 1
  const todayDay = getCampaignDay(campaignStart, now)
  if (personalDay > todayDay) {
    throw new HttpsError('invalid-argument', 'Data de início inválida')
  }
  return Math.max(0, todayDay - personalDay)
}

function isValidPersonalStartDate(
  campaignStart: Date,
  personalStartDateKey: string,
  deadlineKey: string,
  now = new Date()
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(personalStartDateKey)) return false
  const todayKey = formatDateKey(now)
  return (
    personalStartDateKey >= getCampaignStartDateKey(campaignStart) &&
    personalStartDateKey <= deadlineKey &&
    personalStartDateKey <= todayKey
  )
}

async function createFeedEvent(
  campaignId: string,
  type: string,
  playerId: string,
  nickname: string,
  data: Record<string, unknown> = {}
) {
  await db.collection('campaigns').doc(campaignId).collection('feed').add({
    type,
    playerId,
    nickname,
    data,
    createdAt: FieldValue.serverTimestamp(),
  })
}

export const joinCampaign = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Não autenticado')

  const { campaignId, nickname, avatarBase, personalStartDate } = request.data
  if (!personalStartDate || typeof personalStartDate !== 'string') {
    throw new HttpsError('invalid-argument', 'Data de início obrigatória')
  }

  const uid = request.auth.uid
  const campaignRef = db.collection('campaigns').doc(campaignId)
  const campaignSnap = await campaignRef.get()
  if (!campaignSnap.exists) throw new HttpsError('not-found', 'Campanha não encontrada')

  const campaign = campaignSnap.data()!
  const campaignStart = (campaign.startDate as Timestamp).toDate()
  const registrationDeadline = (campaign.registrationDeadline as string) ?? DEFAULT_REGISTRATION_DEADLINE
  const now = new Date()

  if (formatDateKey(now) > registrationDeadline) {
    throw new HttpsError('failed-precondition', 'Inscrições encerradas')
  }
  if (!isValidPersonalStartDate(campaignStart, personalStartDate, registrationDeadline, now)) {
    throw new HttpsError('invalid-argument', 'Data de início inválida')
  }

  const playerRef = campaignRef.collection('players').doc(uid)
  const existing = await playerRef.get()

  if (existing.exists) {
    throw new HttpsError('already-exists', 'Já participa desta campanha')
  }

  const daysSurvived = calculateInitialDaysSurvived(campaignStart, personalStartDate, now)
  const rank = getRankForDays(daysSurvived)
  const yesterday = shiftDateKey(formatDateKey(now), -1)
  const lastConfirmedDate = yesterday >= personalStartDate ? yesterday : null

  const playerData = {
    userId: uid,
    nickname,
    avatarBase,
    avatarConfig: { base: avatarBase, ...RANK_AVATAR_CONFIG[rank.id] },
    status: 'alive',
    joinedAt: FieldValue.serverTimestamp(),
    personalStartDate,
    daysSurvived,
    currentRank: rank.id,
    lastConfirmedDate,
    lastCheckIn: null,
    fallenAt: null,
    fallenDay: null,
    rankAtDeath: null,
    avatarSnapshotAtDeath: null,
    achievements: [],
    epitaph: null,
  }

  await playerRef.set(playerData)
  await createFeedEvent(campaignId, 'JOINED', uid, nickname, { personalStartDate, daysSurvived })

  return { ...playerData, userId: uid }
})

export const performCheckIn = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Não autenticado')

  const { campaignId } = request.data
  const uid = request.auth.uid
  const playerRef = db.collection('campaigns').doc(campaignId).collection('players').doc(uid)
  const yesterday = shiftDateKey(formatDateKey(new Date()), -1)
  const checkinRef = playerRef.collection('checkins').doc(yesterday)

  const result = await db.runTransaction(async (tx) => {
    const playerSnap = await tx.get(playerRef)
    if (!playerSnap.exists) throw new HttpsError('not-found', 'Jogador não encontrado')

    const player = playerSnap.data()!
    if (player.status !== 'alive') throw new HttpsError('failed-precondition', 'Jogador não está vivo')

    const personalStart = player.personalStartDate as string | undefined
    if (!personalStart || yesterday < personalStart) {
      throw new HttpsError('failed-precondition', 'Ainda não há um dia completo para confirmar')
    }
    if ((player.lastConfirmedDate as string | null | undefined) && (player.lastConfirmedDate as string) >= yesterday) {
      throw new HttpsError('already-exists', 'Check-in de ontem já realizado')
    }

    const checkinSnap = await tx.get(checkinRef)
    if (checkinSnap.exists) throw new HttpsError('already-exists', 'Check-in de ontem já realizado')

    const oldDays = player.daysSurvived as number
    const newDays = oldDays + 1
    const oldRank = getRankForDays(oldDays)
    const newRank = getRankForDays(newDays)
    const promoted = oldRank.id !== newRank.id

    const avatarConfig = {
      base: player.avatarBase,
      ...RANK_AVATAR_CONFIG[newRank.id],
    }

    const updates: Record<string, unknown> = {
      daysSurvived: newDays,
      currentRank: newRank.id,
      avatarConfig,
      lastConfirmedDate: yesterday,
      lastCheckIn: FieldValue.serverTimestamp(),
    }

    let newStatus = 'alive'
    if (newDays >= 30) {
      newStatus = 'monk'
      updates.status = 'monk'
    }

    tx.set(checkinRef, { date: yesterday, createdAt: FieldValue.serverTimestamp() })
    tx.update(playerRef, updates)

    return { player: { ...player, ...updates, daysSurvived: newDays, currentRank: newRank.id, status: newStatus }, promoted, newRank: promoted ? newRank.id : null, nickname: player.nickname, newStatus }
  })

  if (result.newStatus === 'monk') {
    await createFeedEvent(campaignId, 'MONK', uid, result.nickname)
  } else if (result.promoted) {
    await createFeedEvent(campaignId, 'PROMOTION', uid, result.nickname, { rank: result.newRank })
  } else {
    await createFeedEvent(campaignId, 'CHECK_IN', uid, result.nickname, { day: (result.player as { daysSurvived: number }).daysSurvived })
  }

  return { userId: uid, player: result.player, promoted: result.promoted, newRank: result.newRank }
})

export const declareFall = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Não autenticado')

  const { campaignId } = request.data
  const uid = request.auth.uid
  const playerRef = db.collection('campaigns').doc(campaignId).collection('players').doc(uid)

  const result = await db.runTransaction(async (tx) => {
    const playerSnap = await tx.get(playerRef)
    if (!playerSnap.exists) throw new HttpsError('not-found', 'Jogador não encontrado')

    const player = playerSnap.data()!
    if (player.status !== 'alive') throw new HttpsError('failed-precondition', 'Jogador já caiu')

    const updates = {
      status: 'fallen',
      fallenAt: FieldValue.serverTimestamp(),
      fallenDay: player.daysSurvived,
      rankAtDeath: player.currentRank,
      avatarSnapshotAtDeath: player.avatarConfig,
    }

    tx.update(playerRef, updates)
    return { ...player, ...updates, nickname: player.nickname }
  })

  await createFeedEvent(campaignId, 'FALLEN', uid, result.nickname, {
    day: result.fallenDay,
    rank: result.rankAtDeath,
  })

  return { userId: uid, player: result }
})

export const createSupportRequest = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Não autenticado')

  const { campaignId } = request.data
  const uid = request.auth.uid
  const playerRef = db.collection('campaigns').doc(campaignId).collection('players').doc(uid)
  const playerSnap = await playerRef.get()

  if (!playerSnap.exists) throw new HttpsError('not-found', 'Jogador não encontrado')
  const player = playerSnap.data()!

  if (player.status !== 'alive') throw new HttpsError('failed-precondition', 'Apenas jogadores vivos podem pedir reforço')

  const lastSupportAt = player.lastSupportRequestAt as Timestamp | undefined
  if (lastSupportAt && Date.now() - lastSupportAt.toMillis() < SUPPORT_COOLDOWN_MS) {
    throw new HttpsError('resource-exhausted', 'Cooldown ativo')
  }

  const requestRef = db.collection('campaigns').doc(campaignId).collection('supportRequests').doc()
  const batch = db.batch()

  batch.set(requestRef, {
    playerId: uid,
    nickname: player.nickname,
    rank: player.currentRank,
    daysSurvived: player.daysSurvived,
    createdAt: FieldValue.serverTimestamp(),
    status: 'active',
    supporterCount: 0,
  })
  batch.update(playerRef, {
    lastSupportRequestAt: FieldValue.serverTimestamp(),
  })

  await batch.commit()
  await createFeedEvent(campaignId, 'SUPPORT_REQUEST', uid, player.nickname, { requestId: requestRef.id })

  return {
    id: requestRef.id,
    playerId: uid,
    nickname: player.nickname,
    rank: player.currentRank,
    daysSurvived: player.daysSurvived,
    status: 'active',
    supporterCount: 0,
  }
})

export const strengthenWarrior = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Não autenticado')

  const { campaignId, requestId, message } = request.data
  const uid = request.auth.uid

  if (!message || message.length > 120) {
    throw new HttpsError('invalid-argument', 'Mensagem inválida')
  }

  const requestRef = db.collection('campaigns').doc(campaignId).collection('supportRequests').doc(requestId)
  const supporterRef = requestRef.collection('supporters').doc(uid)

  await db.runTransaction(async (tx) => {
    const requestSnap = await tx.get(requestRef)
    if (!requestSnap.exists) throw new HttpsError('not-found', 'Pedido não encontrado')

    const supportRequest = requestSnap.data()!
    if (supportRequest.playerId === uid) throw new HttpsError('failed-precondition', 'Não pode fortalecer a si mesmo')

    const createdAt = supportRequest.createdAt as Timestamp | undefined
    if (!createdAt || Date.now() - createdAt.toMillis() >= SUPPORT_COOLDOWN_MS) {
      throw new HttpsError('failed-precondition', 'Pedido expirado')
    }

    const supporterSnap = await tx.get(supporterRef)
    if (supporterSnap.exists) throw new HttpsError('already-exists', 'Já fortaleceu este pedido')

    const userSnap = await tx.get(db.collection('users').doc(uid))
    const nickname = userSnap.exists ? userSnap.data()!.nickname : 'Guerreiro'

    tx.set(supporterRef, {
      userId: uid,
      nickname,
      message: message.slice(0, 120),
      createdAt: FieldValue.serverTimestamp(),
    })

    tx.update(requestRef, {
      supporterCount: FieldValue.increment(1),
    })
  })

  const supporterSnap = await supporterRef.get()
  return { id: supporterRef.id, ...supporterSnap.data() }
})

export const setEpitaph = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Não autenticado')

  const { campaignId, epitaph } = request.data
  const uid = request.auth.uid
  const playerRef = db.collection('campaigns').doc(campaignId).collection('players').doc(uid)

  const playerSnap = await playerRef.get()
  if (!playerSnap.exists) throw new HttpsError('not-found', 'Jogador não encontrado')

  const player = playerSnap.data()!
  if (player.status !== 'fallen') throw new HttpsError('failed-precondition', 'Apenas jogadores caídos podem definir epitáfio')

  await playerRef.update({ epitaph: epitaph.slice(0, 80) })
  return { success: true }
})

export const repairCheckInState = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Não autenticado')
  const email = request.auth.token.email as string | undefined
  if (!email || !REPAIR_ALLOWLIST.includes(email)) {
    throw new HttpsError('permission-denied', 'Não autorizado')
  }

  const dryRun = Boolean(request.data?.dryRun)
  const campaignId = (request.data?.campaignId as string | undefined) ?? DEFAULT_CAMPAIGN_ID
  const now = new Date()
  const today = formatDateKey(now)
  const yesterday = shiftDateKey(today, -1)

  const playersSnap = await db.collection('campaigns').doc(campaignId).collection('players').get()
  const results: Record<string, unknown>[] = []

  for (const playerDoc of playersSnap.docs) {
    const player = playerDoc.data()
    const nickname = player.nickname as string
    if (player.status !== 'alive') {
      results.push({ nickname, skipped: true, reason: player.status })
      continue
    }

    const personalStartDate = player.personalStartDate as string | undefined
    if (!personalStartDate) {
      results.push({ nickname, skipped: true, reason: 'missing-personal-start' })
      continue
    }

    const playerRef = playerDoc.ref
    const checkinsSnap = await playerRef.collection('checkins').get()
    const checkinIds = checkinsSnap.docs.map((d) => d.id)
    const todaySnap = checkinsSnap.docs.find((d) => d.id === today)
    const yesterdaySnap = checkinsSnap.docs.find((d) => d.id === yesterday)

    let action: 'none' | 'moved' | 'deleted-duplicate' = 'none'
    let nextIds = [...checkinIds]

    if (todaySnap && yesterdaySnap) {
      action = 'deleted-duplicate'
      nextIds = checkinIds.filter((id) => id !== today)
    } else if (todaySnap && !yesterdaySnap) {
      action = 'moved'
      nextIds = checkinIds.map((id) => (id === today ? yesterday : id))
    }

    const joinedAt = (player.joinedAt as Timestamp).toDate()
    const state = recomputeConfirmedState({
      personalStartDate,
      joinedAtDateKey: formatDateKey(joinedAt),
      checkinIds: nextIds,
      yesterday,
    })
    const rank = getRankForDays(state.daysSurvived)
    const avatarConfig = {
      base: player.avatarBase,
      ...RANK_AVATAR_CONFIG[rank.id],
    }

    const lastConfirmedCheckin = checkinsSnap.docs.find((d) => d.id === state.lastConfirmedDate)
      ?? (action === 'moved' && state.lastConfirmedDate === yesterday ? todaySnap : undefined)
    const lastCheckIn = lastConfirmedCheckin?.get('createdAt') ?? player.lastCheckIn ?? null

    const before = {
      daysSurvived: player.daysSurvived,
      lastConfirmedDate: player.lastConfirmedDate ?? null,
      checkins: [...checkinIds].sort(),
    }
    const after = {
      daysSurvived: state.daysSurvived,
      lastConfirmedDate: state.lastConfirmedDate,
      checkins: [...nextIds].sort(),
      currentRank: rank.id,
      action,
    }

    if (!dryRun) {
      const batch = db.batch()
      if (action === 'deleted-duplicate' && todaySnap) {
        batch.delete(todaySnap.ref)
      } else if (action === 'moved' && todaySnap) {
        batch.set(playerRef.collection('checkins').doc(yesterday), {
          date: yesterday,
          createdAt: todaySnap.get('createdAt') ?? FieldValue.serverTimestamp(),
        })
        batch.delete(todaySnap.ref)
      }
      batch.update(playerRef, {
        daysSurvived: state.daysSurvived,
        lastConfirmedDate: state.lastConfirmedDate,
        currentRank: rank.id,
        avatarConfig,
        lastCheckIn,
      })
      await batch.commit()
    }

    results.push({ nickname, before, after })
  }

  return { dryRun, today, yesterday, campaignId, results }
})

export const ensureDefaultCampaign = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Não autenticado')

  const ref = db.collection('campaigns').doc(DEFAULT_CAMPAIGN_ID)
  const snap = await ref.get()

  if (!snap.exists) {
    await ref.set({
      name: 'Operação Setembro',
      year: 2026,
      startDate: Timestamp.fromDate(new Date(2026, 8, 1)),
      endDate: Timestamp.fromDate(new Date(2026, 8, 30, 23, 59, 59, 999)),
      status: 'active',
      registrationDeadline: DEFAULT_REGISTRATION_DEADLINE,
    })
    return { campaignId: DEFAULT_CAMPAIGN_ID, created: true }
  }

  return { campaignId: DEFAULT_CAMPAIGN_ID, created: false }
})
