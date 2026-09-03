import {
  dateKeysInclusive,
  getYesterdayKey,
  shiftDateKey,
} from './dates'

export type CheckInBlockReason = 'ok' | 'too-early' | 'already-confirmed'

export interface CheckInAvailability {
  yesterday: string
  canCheckIn: boolean
  reason: CheckInBlockReason
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
    return { yesterday, canCheckIn: false, reason: 'too-early' }
  }
  if ((params.lastConfirmedDate ?? '') >= yesterday) {
    return { yesterday, canCheckIn: false, reason: 'already-confirmed' }
  }
  return { yesterday, canCheckIn: true, reason: 'ok' }
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
  return { yesterday: availability.yesterday }
}

