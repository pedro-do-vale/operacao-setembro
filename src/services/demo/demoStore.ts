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

const CAMPAIGN_ID = 'operacao-setembro-2026'

function makePlayer(
  id: string,
  nickname: string,
  avatarBase: AvatarBase,
  daysSurvived: number,
  status: 'alive' | 'fallen' | 'monk',
  opts: Partial<CampaignPlayer> = {}
): CampaignPlayer {
  const rankId = opts.currentRank ?? (status === 'fallen' ? opts.rankAtDeath! : getRankIdForDays(daysSurvived, status))
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
    fallenAt: status === 'fallen' ? new Date('2026-09-15') : null,
    fallenDay: status === 'fallen' ? daysSurvived : null,
    rankAtDeath: status === 'fallen' ? rankId : null,
    avatarSnapshotAtDeath: status === 'fallen' ? { ...avatarConfig } : null,
    achievements: opts.achievements ?? [],
    epitaph: status === 'fallen' ? (opts.epitaph ?? 'Eu achei que dava.') : null,
    ...opts,
  }
}

function getRankIdForDays(days: number, status: string): string {
  const ranks = [
    [0, 'soldado'], [3, 'cabo'], [5, '3-sargento'], [7, '2-sargento'], [9, '1-sargento'],
    [11, 'subtenente'], [13, 'aspirante'], [15, '2-tenente'], [17, '1-tenente'], [19, 'capitao'],
    [21, 'major'], [23, 'coronel'], [25, 'general'], [27, 'rei'], [29, 'monge'],
  ]
  if (status === 'monk') return 'monge'
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (days >= (ranks[i][0] as number)) return ranks[i][1] as string
  }
  return 'soldado'
}

const players: CampaignPlayer[] = [
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
]

const feedEvents: FeedEvent[] = [
  { id: 'f1', type: 'CHECK_IN', playerId: 'p1', nickname: 'PEDRÃO', data: { day: 19 }, createdAt: new Date() },
  { id: 'f2', type: 'PROMOTION', playerId: 'p2', nickname: 'BRUNÃO', data: { rank: '1º Tenente' }, createdAt: new Date(Date.now() - 3600000) },
  { id: 'f3', type: 'FALLEN', playerId: 'p9', nickname: 'JOÃO', data: { day: 8, rank: '2º Sargento' }, createdAt: new Date(Date.now() - 7200000) },
  { id: 'f4', type: 'SUPPORT_REQUEST', playerId: 'p1', nickname: 'PEDRÃO', data: { requestId: 'sr1' }, createdAt: new Date(Date.now() - 1800000) },
  { id: 'f5', type: 'MONK', playerId: 'p6', nickname: 'RAFAEL', data: {}, createdAt: new Date(Date.now() - 86400000) },
  { id: 'f6', type: 'TOP_3', playerId: 'p5', nickname: 'CARLOS', data: { position: 1 }, createdAt: new Date(Date.now() - 172800000) },
]

const supportRequests: SupportRequest[] = [
  {
    id: 'sr1',
    playerId: 'p1',
    nickname: 'PEDRÃO',
    rank: 'Capitão',
    daysSurvived: 19,
    createdAt: new Date(Date.now() - 1800000),
    status: 'active',
    supporterCount: 3,
  },
]

const supporters: Record<string, Supporter[]> = {
  sr1: [
    { id: 's1', userId: 'p2', nickname: 'BRUNÃO', message: 'Tu não chegou até o dia 17 pra cair agora.', createdAt: new Date() },
    { id: 's2', userId: 'p3', nickname: 'PAULO', message: '🫡 RESISTA, SOLDADO.', createdAt: new Date() },
    { id: 's3', userId: 'p4', nickname: 'JUNINHO', message: 'O Capitão está logo ali.', createdAt: new Date() },
  ],
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

const playerListeners = new Set<() => void>()
const feedListeners = new Set<() => void>()
const supportListeners = new Set<() => void>()

function notifyPlayers() { playerListeners.forEach((cb) => cb()) }
function notifyFeed() { feedListeners.forEach((cb) => cb()) }
function notifySupport() { supportListeners.forEach((cb) => cb()) }

export const demoStore = {
  getCampaign: () => campaign,
  getCampaignId: () => CAMPAIGN_ID,

  getPlayers: () => [...players],
  getAlivePlayers: () => players.filter((p) => p.status === 'alive' || p.status === 'monk'),
  getFallenPlayers: () => players.filter((p) => p.status === 'fallen'),

  getPlayer: (id: string) => players.find((p) => p.id === id) ?? null,
  getCurrentPlayer: () => (currentPlayerId ? players.find((p) => p.id === currentPlayerId) ?? null : null),
  setCurrentPlayer: (id: string) => { currentPlayerId = id },

  getFeed: () => [...feedEvents].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  getSupportRequests: () => supportRequests.filter((r) => r.status === 'active'),
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
    const today = new Date().toISOString().split('T')[0]
    const lastDate = player.lastCheckIn?.toISOString().split('T')[0]
    if (lastDate === today) throw new Error('Check-in já realizado hoje')

    const oldDays = player.daysSurvived
    player.daysSurvived += 1
    player.lastCheckIn = new Date()
    const newRank = getRankIdForDays(player.daysSurvived, player.status)
    const promoted = newRank !== player.currentRank
    player.currentRank = newRank
    player.avatarConfig = buildAvatarConfigForRank(newRank, player.avatarBase)

    if (player.daysSurvived >= 30) {
      player.status = 'monk'
      feedEvents.unshift({ id: `f-${Date.now()}`, type: 'MONK', playerId, nickname: player.nickname, data: {}, createdAt: new Date() })
    } else if (promoted) {
      feedEvents.unshift({ id: `f-${Date.now()}`, type: 'PROMOTION', playerId, nickname: player.nickname, data: { rank: newRank, oldDays, newDays: player.daysSurvived }, createdAt: new Date() })
    } else {
      feedEvents.unshift({ id: `f-${Date.now()}`, type: 'CHECK_IN', playerId, nickname: player.nickname, data: { day: player.daysSurvived }, createdAt: new Date() })
    }

    notifyPlayers()
    notifyFeed()
    return { player, promoted, newRank: promoted ? newRank : null }
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

  createSupportRequest: (playerId: string) => {
    const player = players.find((p) => p.id === playerId)
    if (!player || player.status !== 'alive') throw new Error('Pedido não permitido')
    if (lastSupportRequestAt && Date.now() - lastSupportRequestAt.getTime() < 6 * 3600000) {
      throw new Error('Cooldown ativo')
    }

    const request: SupportRequest = {
      id: `sr-${Date.now()}`,
      playerId,
      nickname: player.nickname,
      rank: getRankIdForDays(player.daysSurvived, player.status),
      daysSurvived: player.daysSurvived,
      createdAt: new Date(),
      status: 'active',
      supporterCount: 0,
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

  strengthen: (requestId: string, userId: string, nickname: string, message: string) => {
    const request = supportRequests.find((r) => r.id === requestId)
    if (!request) throw new Error('Pedido não encontrado')
    if (request.playerId === userId) throw new Error('Não pode fortalecer a si mesmo')
    const existing = (supporters[requestId] ?? []).find((s) => s.userId === userId)
    if (existing) throw new Error('Já fortaleceu este pedido')

    const supporter: Supporter = {
      id: `sup-${Date.now()}`,
      userId,
      nickname,
      message: message.slice(0, 120),
      createdAt: new Date(),
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
