import { GAME_CONFIG } from '../config/gameConfig'
import {
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

/** Dias já sobrevividos antes do dia atual (check-in de hoje ainda é necessário). */
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
  const start = parseDateKey(getCampaignStartDateKey(campaignStart))
  start.setHours(0, 0, 0, 0)

  const lastAllowed = Math.min(
    endOfDay(deadlineKey).getTime(),
    new Date(referenceDate).setHours(23, 59, 59, 999)
  )

  const dates: string[] = []
  const current = new Date(start)
  current.setHours(0, 0, 0, 0)

  while (current.getTime() <= lastAllowed) {
    dates.push(formatDateKey(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
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
