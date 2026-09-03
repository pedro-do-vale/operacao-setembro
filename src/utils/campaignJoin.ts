import { GAME_CONFIG } from '../config/gameConfig'
import {
  dateKeysInclusive,
  formatDateKey,
  getCampaignDay,
  getCampaignStartDateKey,
  endOfDay,
  parseDateKey,
} from './dates'

export function isRegistrationOpen(
  now: Date = new Date(),
  deadlineKey: string = GAME_CONFIG.REGISTRATION_DEADLINE
): boolean {
  return now.getTime() <= endOfDay(deadlineKey).getTime()
}

/** Dias já encerrados até ontem (o dia atual só confirma no dia seguinte). */
export function calculateInitialDaysSurvived(
  campaignStart: Date,
  personalStartDateKey: string,
  referenceDate: Date = new Date()
): number {
  const personalDay = getCampaignDay(campaignStart, parseDateKey(personalStartDateKey))
  const todayDay = getCampaignDay(campaignStart, referenceDate)
  if (personalDay > todayDay) {
    throw new Error('Data de início não pode ser no futuro')
  }
  return Math.max(0, todayDay - personalDay)
}

export function getSelectableStartDateKeys(
  campaignStart: Date,
  deadlineKey: string = GAME_CONFIG.REGISTRATION_DEADLINE,
  referenceDate: Date = new Date()
): string[] {
  const startKey = getCampaignStartDateKey(campaignStart)
  const todayKey = formatDateKey(referenceDate)
  const lastKey = todayKey < deadlineKey ? todayKey : deadlineKey
  return dateKeysInclusive(startKey, lastKey)
}

export function isValidPersonalStartDate(
  campaignStart: Date,
  personalStartDateKey: string,
  deadlineKey: string = GAME_CONFIG.REGISTRATION_DEADLINE,
  referenceDate: Date = new Date()
): boolean {
  return getSelectableStartDateKeys(campaignStart, deadlineKey, referenceDate).includes(
    personalStartDateKey
  )
}

export function formatStartDateLabel(dateKey: string, campaignStart: Date): string {
  const day = getCampaignDay(campaignStart, parseDateKey(dateKey))
  const [, month, dayOfMonth] = dateKey.split('-')
  return `Dia ${day} — ${dayOfMonth}/${month}`
}
