import type {
  Campaign,
  CampaignPlayer,
  FeedEvent,
  SupportRequest,
  Supporter,
  AvatarBase,
} from '../../types'
import { buildAvatarConfigForRank, getRankForDays } from '../../utils/ranks'
import {
  calculateInitialDaysSurvived,
  isRegistrationOpen,
  isValidPersonalStartDate,
} from '../../utils/campaignJoin'
import {
  getCheckInAvailability,
  getConsecutiveMissedCheckInDays,
  getJoinLastConfirmedDate,
  MAX_CONSECUTIVE_MISSED_CHECK_INS,
} from '../../utils/checkIn'
import { getYesterdayKey, shiftDateKey, parseDateKey } from '../../utils/dates'
import { RANKS } from '../../config/ranks'

const CAMPAIGN_ID = 'operacao-setembro-2026'

function makePlayer(
  id: string,
  nickname: string,
  avatarBase: AvatarBase,
  daysSurvived: number,
  status: 'alive' | 'fallen' | 'monk',
  opts: Partial<CampaignPlayer> = {}
): CampaignPlayer {
  const rankId = opts.currentRank ?? (status === 'fallen' ? opts.rankAtDeath! : getRankForDays(daysSurvived).id)
  const avatarConfig = buildAvatarConfigForRank(rankId, avatarBase)
  return {
    id,
    userId: id,
    nickname,
    avatarBase,
    avatarConfig,
    status,
    joinedAt: new Date('2026-09-01'),
    personalStartDate: opts.personalStartDate ?? '2026-09-01',
    daysSurvived,
    currentRank: rankId,
    lastCheckIn: status === 'alive' || status === 'monk' ? new Date() : null,
    lastConfirmedDate:
      opts.lastConfirmedDate ?? (status === 'alive' || status === 'monk' ? getYesterdayKey() : null),
    fallenAt: status === 'fallen' ? new Date('2026-09-15') : null,
    fallenDay: status === 'fallen' ? daysSurvived : null,
    rankAtDeath: status === 'fallen' ? rankId : null,
    avatarSnapshotAtDeath: status === 'fallen' ? { ...avatarConfig } : null,
    achievements: opts.achievements ?? [],
    epitaph: status === 'fallen' ? (opts.epitaph ?? 'Eu achei que dava.') : null,
    ...opts,
  }
}

const players: CampaignPlayer[] = [
  makePlayer('p15', 'PEREGRINO', 'base-a', 29, 'alive', {
    personalStartDate: shiftDateKey(getYesterdayKey(), -29),
    lastConfirmedDate: shiftDateKey(getYesterdayKey(), -1),
    lastCheckIn: new Date(Date.now() - 86400000),
  }),
  makePlayer('p1', 'PEDRÃO', 'base-a', 19, 'alive'),
  makePlayer('p2', 'BRUNÃO', 'base-b', 17, 'alive'),
  makePlayer('p3', 'PAULO', 'base-a', 15, 'alive'),
  makePlayer('p4', 'JUNINHO', 'base-b', 12, 'alive'),
  makePlayer('p5', 'CARLOS', 'base-a', 27, 'alive', { currentRank: 'rei' }),
  makePlayer('p6', 'RAFAEL', 'base-b', 30, 'monk', { currentRank: 'monge', daysSurvived: 30 }),
  makePlayer('p7', 'MARCOS', 'base-a', 3, 'alive'),
  makePlayer('p8', 'LUCAS', 'base-b', 1, 'alive'),
  makePlayer('p9', 'JOÃO', 'base-a', 8, 'fallen', { rankAtDeath: '2-sargento', epitaph: 'Foi sem querer.' }),
  makePlayer('p10', 'TIAGO', 'base-b', 20, 'fallen', { rankAtDeath: 'capitao', epitaph: 'Morri como Capitão.' }),
  makePlayer('p11', 'FELIPE', 'base-a', 26, 'fallen', { rankAtDeath: 'general', epitaph: 'Quase Monge.' }),
  makePlayer('p12', 'GUSTAVO', 'base-b', 5, 'fallen', { rankAtDeath: '3-sargento', epitaph: 'Não tankei.' }),
  makePlayer('p13', 'ATRASADO', 'base-b', 10, 'alive', {
    lastCheckIn: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    lastConfirmedDate: shiftDateKey(getYesterdayKey(), -4),
  }),
  makePlayer('p14', 'RETARDATÁRIO', 'base-a', 10, 'alive', {
    lastCheckIn: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    lastConfirmedDate: shiftDateKey(getYesterdayKey(), -3),
  }),
]

const feedEvents: FeedEvent[] = [
  ...RANKS.filter(rank => rank.minDays > 0 && rank.minDays < 30).map(rank => {
    const date = shiftDateKey(players.find(player => player.id === 'p15')!.personalStartDate!, rank.minDays - 1)
    return { id: `journey-p15-${rank.id}`, type: 'PROMOTION' as const, playerId: 'p15', nickname: 'PEREGRINO', data: { rank: rank.id, date }, createdAt: parseDateKey(shiftDateKey(date, 1)) }
  }),
  { id: 'f1', type: 'CHECK_IN', playerId: 'p1', nickname: 'PEDRÃO', data: { day: 19 }, createdAt: new Date() },
  { id: 'f2', type: 'PROMOTION', playerId: 'p2', nickname: 'BRUNÃO', data: { rank: '1º Tenente' }, createdAt: new Date(Date.now() - 3600000) },
  { id: 'f3', type: 'FALLEN', playerId: 'p9', nickname: 'JOÃO', data: { day: 8, rank: '2º Sargento' }, createdAt: new Date(Date.now() - 7200000) },
  { id: 'f4', type: 'SUPPORT_REQUEST', playerId: 'p1', nickname: 'PEDRÃO', data: { requestId: 'sr1' }, createdAt: new Date(Date.now() - 1800000) },
  { id: 'f7', type: 'SUPPORT_REQUEST', playerId: 'p2', nickname: 'BRUNÃO', data: { requestId: 'sr2' }, createdAt: new Date(Date.now() - 900000) },
  { id: 'f5', type: 'MONK', playerId: 'p6', nickname: 'RAFAEL', data: {}, createdAt: new Date(Date.now() - 86400000) },
  { id: 'f6', type: 'TOP_3', playerId: 'p5', nickname: 'CARLOS', data: { position: 1 }, createdAt: new Date(Date.now() - 172800000) },
]

const supportRequests: SupportRequest[] = [
  ...[7, 16, 23].map((day, index) => ({
    id: `journey-support-${day}`,
    playerId: index === 1 ? 'p15' : 'p2',
    nickname: index === 1 ? 'PEREGRINO' : 'BRUNÃO',
    rank: getRankForDays(day).id,
    daysSurvived: day,
    createdAt: parseDateKey(shiftDateKey(players.find(player => player.id === 'p15')!.personalStartDate!, day - 1)),
    status: 'closed' as const,
    supporterCount: [3, 5, 2][index],
    message: ['Hoje foi difícil. Preciso de reforços.', 'Cheguei até aqui com vocês. Me ajudem a continuar.', 'Falta pouco. Vamos terminar juntos.'][index],
  })),
  {
    id: 'sr1',
    playerId: 'p1',
    nickname: 'PEDRÃO',
    rank: 'capitao',
    daysSurvived: 19,
    createdAt: new Date(Date.now() - 1800000),
    status: 'active',
    supporterCount: 3,
    message: 'To no limite hoje. Preciso aguentar.',
  },
  {
    id: 'sr2',
    playerId: 'p2',
    nickname: 'BRUNÃO',
    rank: '1-tenente',
    daysSurvived: 17,
    createdAt: new Date(Date.now() - 900000),
    status: 'active',
    supporterCount: 0,
    message: 'Estou na linha de fogo.',
    hasImage: true,
    imagePath: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  },
]

const supporters: Record<string, Supporter[]> = {
  sr1: [
    { id: 's1', userId: 'p2', nickname: 'BRUNÃO', message: 'Tu não chegou até o dia 17 pra cair agora.', createdAt: new Date(), hasImage: true, imagePath: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' },
    { id: 's2', userId: 'p3', nickname: 'PAULO', message: '🫡 RESISTA, SOLDADO.', createdAt: new Date() },
    { id: 's3', userId: 'p4', nickname: 'JUNINHO', message: 'O Capitão está logo ali.', createdAt: new Date() },
  ],
  sr2: [],
}

const campaign: Campaign = {
  id: CAMPAIGN_ID,
  name: 'Operação Setembro',
  year: 2026,
  startDate: new Date('2026-09-01'),
  endDate: new Date('2026-09-30'),
  status: 'active',
  registrationDeadline: '2026-09-04',
}

let currentPlayerId: string | null = 'p1'
let lastSupportRequestAt: Date | null = new Date(Date.now() - 8 * 3600000)
const initialFeedIds = new Set(feedEvents.map(event => event.id))
const initialSupportIds = new Set(supportRequests.map(request => request.id))

const playerListeners = new Set<() => void>()
const feedListeners = new Set<() => void>()
const supportListeners = new Set<() => void>()

function notifyPlayers() { playerListeners.forEach((cb) => cb()) }
function notifyFeed() { feedListeners.forEach((cb) => cb()) }
function notifySupport() { supportListeners.forEach((cb) => cb()) }

function moveOverdueDemoPlayerToGraveyard(player: CampaignPlayer): boolean {
  const missedDays = getConsecutiveMissedCheckInDays({
    personalStartDate: player.personalStartDate,
    lastConfirmedDate: player.lastConfirmedDate,
  })
  if (player.status !== 'alive' || missedDays < MAX_CONSECUTIVE_MISSED_CHECK_INS) {
    return false
  }

  player.status = 'fallen'
  player.fallenAt = new Date()
  player.fallenDay = player.daysSurvived
  player.rankAtDeath = player.currentRank
  player.avatarSnapshotAtDeath = { ...player.avatarConfig }
  player.epitaph = null

  feedEvents.unshift({
    id: `f-inactive-${player.id}`,
    type: 'FALLEN',
    playerId: player.id,
    nickname: player.nickname,
    data: {
      day: player.fallenDay,
      rank: player.rankAtDeath,
      reason: 'MISSED_CHECK_INS',
      missedDays,
    },
    createdAt: new Date(),
  })

  notifyPlayers()
  notifyFeed()
  return true
}

export const demoStore = {
  resetFinalBattle: (userId: string) => {
    const index = players.findIndex(player => player.userId === userId)
    if (index < 0) return false
    const previous = players[index]
    players[index] = makePlayer(previous.id, previous.nickname, previous.avatarBase, 29, 'alive', {
      userId,
      personalStartDate: shiftDateKey(getYesterdayKey(), -29),
      lastConfirmedDate: shiftDateKey(getYesterdayKey(), -1),
      lastCheckIn: new Date(Date.now() - 86400000),
    })
    currentPlayerId = previous.id
    lastSupportRequestAt = null
    for (let i = feedEvents.length - 1; i >= 0; i--) {
      if (feedEvents[i].playerId === previous.id && !initialFeedIds.has(feedEvents[i].id)) feedEvents.splice(i, 1)
    }
    for (let i = supportRequests.length - 1; i >= 0; i--) {
      if (supportRequests[i].playerId === previous.id && !initialSupportIds.has(supportRequests[i].id)) {
        delete supporters[supportRequests[i].id]
        supportRequests.splice(i, 1)
      }
    }
    notifyPlayers()
    notifyFeed()
    notifySupport()
    return true
  },
  getCampaign: () => campaign,
  getCampaignId: () => CAMPAIGN_ID,

  getPlayers: () => [...players],
  getAlivePlayers: () => players.filter((p) => p.status === 'alive' || p.status === 'monk'),
  getFallenPlayers: () => players.filter((p) => p.status === 'fallen'),

  getPlayer: (id: string) => players.find((p) => p.id === id) ?? null,
  getCurrentPlayer: () => (currentPlayerId ? players.find((p) => p.id === currentPlayerId) ?? null : null),
  setCurrentPlayer: (id: string) => {
    currentPlayerId = id
    const player = players.find((candidate) => candidate.id === id)
    if (player) moveOverdueDemoPlayerToGraveyard(player)
  },

  getFeed: () => [...feedEvents].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  getSupportRequests: () => supportRequests.filter((r) => r.status === 'active'),
  getSupportHistory: () => [...supportRequests],
  getSupporters: (requestId: string) => supporters[requestId] ?? [],

  subscribePlayers: (cb: () => void) => {
    playerListeners.add(cb)
    return () => playerListeners.delete(cb)
  },
  subscribeFeed: (cb: () => void) => {
    feedListeners.add(cb)
    return () => feedListeners.delete(cb)
  },
  subscribeSupport: (cb: () => void) => {
    supportListeners.add(cb)
    return () => supportListeners.delete(cb)
  },

  joinCampaign: (userId: string, nickname: string, avatarBase: AvatarBase, personalStartDate: string) => {
    const existing = players.find((p) => p.userId === userId)
    if (existing) return existing

    const deadline = campaign.registrationDeadline ?? '2026-09-04'
    if (!isRegistrationOpen(new Date(), deadline)) {
      throw new Error('Inscrições encerradas')
    }
    if (!isValidPersonalStartDate(campaign.startDate, personalStartDate, deadline)) {
      throw new Error('Data de início inválida')
    }

    const daysSurvived = calculateInitialDaysSurvived(campaign.startDate, personalStartDate)
    const rankId = getRankForDays(daysSurvived).id
    const player = makePlayer(userId, nickname, avatarBase, daysSurvived, 'alive', {
      currentRank: rankId,
      personalStartDate,
      lastCheckIn: null,
      lastConfirmedDate: getJoinLastConfirmedDate(personalStartDate),
    })
    players.push(player)
    currentPlayerId = userId
    feedEvents.unshift({
      id: `f-${Date.now()}`,
      type: 'JOINED',
      playerId: userId,
      nickname,
      data: {},
      createdAt: new Date(),
    })
    notifyPlayers()
    notifyFeed()
    return player
  },

  performCheckIn: (playerId: string) => {
    const player = players.find((p) => p.id === playerId)
    if (!player || player.status !== 'alive') throw new Error('Check-in não permitido')
    if (getConsecutiveMissedCheckInDays({
      personalStartDate: player.personalStartDate,
      lastConfirmedDate: player.lastConfirmedDate,
    }) >= MAX_CONSECUTIVE_MISSED_CHECK_INS) {
      moveOverdueDemoPlayerToGraveyard(player)
      throw new Error('Você ficou 3 dias seguidos sem check-in e foi para o cemitério')
    }
    const availability = getCheckInAvailability({
      personalStartDate: player.personalStartDate,
      lastConfirmedDate: player.lastConfirmedDate,
    })
    if (availability.reason === 'too-early') {
      throw new Error('Ainda não há um dia completo para confirmar')
    }
    if (availability.reason === 'already-confirmed') {
      throw new Error('Check-in de ontem já realizado')
    }
    if (!availability.checkInDate) {
      throw new Error('Check-in não permitido')
    }
    const checkInDate = availability.checkInDate

    const oldDays = player.daysSurvived
    player.daysSurvived += 1
    player.lastCheckIn = new Date()
    player.lastConfirmedDate = checkInDate
    const newRank = getRankForDays(player.daysSurvived).id
    const promoted = newRank !== player.currentRank
    player.currentRank = newRank
    player.avatarConfig = buildAvatarConfigForRank(newRank, player.avatarBase)

    if (player.daysSurvived >= 30) {
      player.status = 'monk'
      feedEvents.unshift({ id: `f-${Date.now()}`, type: 'MONK', playerId, nickname: player.nickname, data: {}, createdAt: new Date() })
    } else if (promoted) {
      feedEvents.unshift({ id: `f-${Date.now()}`, type: 'PROMOTION', playerId, nickname: player.nickname, data: { rank: newRank, oldDays, newDays: player.daysSurvived }, createdAt: new Date() })
    } else {
      feedEvents.unshift({ id: `f-${Date.now()}`, type: 'CHECK_IN', playerId, nickname: player.nickname, data: { day: player.daysSurvived, date: checkInDate }, createdAt: new Date() })
    }

    notifyPlayers()
    notifyFeed()
    return { player, promoted, newRank: promoted ? newRank : null, confirmedDate: checkInDate }
  },

  declareFall: (playerId: string) => {
    const player = players.find((p) => p.id === playerId)
    if (!player || player.status !== 'alive') throw new Error('Queda não permitida')

    player.status = 'fallen'
    player.fallenAt = new Date()
    player.fallenDay = player.daysSurvived
    player.rankAtDeath = player.currentRank
    player.avatarSnapshotAtDeath = { ...player.avatarConfig }

    feedEvents.unshift({
      id: `f-${Date.now()}`,
      type: 'FALLEN',
      playerId,
      nickname: player.nickname,
      data: { day: player.fallenDay, rank: player.rankAtDeath },
      createdAt: new Date(),
    })

    notifyPlayers()
    notifyFeed()
    return player
  },

  createSupportRequest: (
    playerId: string,
    options: { id?: string; message?: string; hasImage?: boolean; imagePath?: string } = {},
  ) => {
    const player = players.find((p) => p.id === playerId)
    if (!player || player.status !== 'alive') throw new Error('Pedido não permitido')
    if (lastSupportRequestAt && Date.now() - lastSupportRequestAt.getTime() < 6 * 3600000) {
      throw new Error('Cooldown ativo')
    }

    const message = (options.message ?? '').trim().slice(0, 120)
    const hasImage = Boolean(options.hasImage && options.imagePath)
    if (!message && !hasImage) throw new Error('Mensagem inválida')

    const request: SupportRequest = {
      id: options.id ?? `sr-${Date.now()}`,
      playerId,
      nickname: player.nickname,
      rank: getRankForDays(player.daysSurvived).id,
      daysSurvived: player.daysSurvived,
      createdAt: new Date(),
      status: 'active',
      supporterCount: 0,
      message,
      hasImage,
      imagePath: hasImage ? options.imagePath : undefined,
    }
    supportRequests.push(request)
    supporters[request.id] = []
    lastSupportRequestAt = new Date()

    feedEvents.unshift({
      id: `f-${Date.now()}`,
      type: 'SUPPORT_REQUEST',
      playerId,
      nickname: player.nickname,
      data: { requestId: request.id },
      createdAt: new Date(),
    })

    notifySupport()
    notifyFeed()
    return request
  },

  strengthen: (
    requestId: string,
    userId: string,
    nickname: string,
    message: string,
    image?: { hasImage: boolean; imagePath?: string },
  ) => {
    const request = supportRequests.find((r) => r.id === requestId)
    if (!request) throw new Error('Pedido não encontrado')
    if (request.playerId === userId) throw new Error('Não pode fortalecer a si mesmo')
    if (Date.now() - request.createdAt.getTime() >= 6 * 3600000) {
      throw new Error('Pedido expirado')
    }
    const existing = (supporters[requestId] ?? []).find((s) => s.userId === userId)
    if (existing) throw new Error('Já fortaleceu este pedido')

    const trimmed = message.trim().slice(0, 120)
    const hasImage = Boolean(image?.hasImage && image.imagePath)
    if (!trimmed && !hasImage) throw new Error('Mensagem inválida')

    const supporter: Supporter = {
      id: `sup-${Date.now()}`,
      userId,
      nickname,
      message: trimmed,
      createdAt: new Date(),
      hasImage,
      imagePath: hasImage ? image?.imagePath : undefined,
    }
    if (!supporters[requestId]) supporters[requestId] = []
    supporters[requestId].push(supporter)
    request.supporterCount = (request.supporterCount ?? 0) + 1

    notifySupport()
    return supporter
  },

  setEpitaph: (playerId: string, epitaph: string) => {
    const player = players.find((p) => p.id === playerId)
    if (!player || player.status !== 'fallen') throw new Error('Epitáfio não permitido')
    player.epitaph = epitaph.slice(0, 80)
    notifyPlayers()
  },

  getLastSupportRequestAt: () => lastSupportRequestAt,
}
