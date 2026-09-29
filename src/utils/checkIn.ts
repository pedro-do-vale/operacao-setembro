import {
  dateKeyToDayNumber,
  dateKeysInclusive,
  getYesterdayKey,
  shiftDateKey,
} from './dates'

export const MAX_CONSECUTIVE_MISSED_CHECK_INS = 3

export type CheckInBlockReason = 'ok' | 'too-early' | 'already-confirmed' | 'missed-limit'

export interface CheckInAvailability {
  yesterday: string
  checkInDate: string | null
  pendingCount: number
  canCheckIn: boolean
  reason: CheckInBlockReason
}

export function getConsecutiveMissedCheckInDays(params: {
  personalStartDate: string | null
  lastConfirmedDate: string | null
  now?: Date
}): number {
  if (!params.personalStartDate) return 0

  const yesterday = getYesterdayKey(params.now)
  const confirmationBaseline = params.lastConfirmedDate
    ?? shiftDateKey(params.personalStartDate, -1)

  // O check-in de uma data fica disponível durante todo o dia seguinte.
  // Por isso, ontem ainda é uma oportunidade aberta, não uma ausência concluída.
  return Math.max(
    0,
    dateKeyToDayNumber(yesterday) - dateKeyToDayNumber(confirmationBaseline) - 1,
  )
}

export function getJoinLastConfirmedDate(
  personalStartDate: string,
  now: Date = new Date()
): string | null {
  const yesterday = getYesterdayKey(now)
  return yesterday >= personalStartDate ? yesterday : null
}

export function getCheckInAvailability(params: {
  personalStartDate: string | null
  lastConfirmedDate: string | null
  now?: Date
}): CheckInAvailability {
  const yesterday = getYesterdayKey(params.now)
  if (!params.personalStartDate || yesterday < params.personalStartDate) {
    return { yesterday, checkInDate: null, pendingCount: 0, canCheckIn: false, reason: 'too-early' }
  }
  if (getConsecutiveMissedCheckInDays(params) >= MAX_CONSECUTIVE_MISSED_CHECK_INS) {
    return { yesterday, checkInDate: null, pendingCount: 0, canCheckIn: false, reason: 'missed-limit' }
  }

  const checkInDate = params.lastConfirmedDate
    ? shiftDateKey(params.lastConfirmedDate, 1)
    : params.personalStartDate

  if (checkInDate > yesterday) {
    return { yesterday, checkInDate: null, pendingCount: 0, canCheckIn: false, reason: 'already-confirmed' }
  }

  const pendingCount = dateKeyToDayNumber(yesterday) - dateKeyToDayNumber(checkInDate) + 1
  return { yesterday, checkInDate, pendingCount, canCheckIn: true, reason: 'ok' }
}

export function remapTodayCheckinIds(
  checkinIds: string[],
  today: string,
  yesterday: string
): { ids: string[]; action: 'none' | 'moved' | 'deleted-duplicate' } {
  const hasToday = checkinIds.includes(today)
  const hasYesterday = checkinIds.includes(yesterday)
  if (!hasToday) return { ids: [...checkinIds], action: 'none' }
  if (hasYesterday) {
    return { ids: checkinIds.filter((id) => id !== today), action: 'deleted-duplicate' }
  }
  return {
    ids: checkinIds.map((id) => (id === today ? yesterday : id)),
    action: 'moved',
  }
}

export function recomputeConfirmedState(params: {
  personalStartDate: string
  joinedAtDateKey: string
  checkinIds: string[]
  yesterday: string
}): { daysSurvived: number; lastConfirmedDate: string | null; confirmedDates: string[] } {
  const dayBeforeJoin = shiftDateKey(params.joinedAtDateKey, -1)
  const autoGranted = dateKeysInclusive(params.personalStartDate, dayBeforeJoin)
  const checkins = params.checkinIds.filter(
    (id) => id <= params.yesterday && id >= params.personalStartDate
  )
  const confirmedDates = [...new Set([...autoGranted, ...checkins])].sort()
  return {
    daysSurvived: confirmedDates.length,
    lastConfirmedDate: confirmedDates[confirmedDates.length - 1] ?? null,
    confirmedDates,
  }
}

export function confirmYesterdayCheckIn(params: {
  personalStartDate: string | null
  lastConfirmedDate: string | null
  now?: Date
}): { yesterday: string } {
  const availability = getCheckInAvailability(params)
  if (availability.reason === 'too-early') {
    throw new Error('Ainda não há um dia completo para confirmar')
  }
  if (availability.reason === 'already-confirmed') {
    throw new Error('Check-in de ontem já realizado')
  }
  if (availability.reason === 'missed-limit' || !availability.checkInDate) {
    throw new Error('Limite de 3 dias sem check-in atingido')
  }
  return { yesterday: availability.checkInDate }
}

