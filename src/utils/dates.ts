export function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0, 0)
}

export function endOfDay(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d, 23, 59, 59, 999)
}

export function getCampaignStartDateKey(startDate: Date): string {
  return [
    startDate.getUTCFullYear(),
    String(startDate.getUTCMonth() + 1).padStart(2, '0'),
    String(startDate.getUTCDate()).padStart(2, '0'),
  ].join('-')
}

function dateKeyToDayNumber(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number)
  return Math.floor(Date.UTC(year, month - 1, day) / (1000 * 60 * 60 * 24))
}

export function getCampaignDay(startDate: Date, referenceDate: Date = new Date()): number {
  const startDay = dateKeyToDayNumber(getCampaignStartDateKey(startDate))
  const referenceDay = dateKeyToDayNumber(formatDateKey(referenceDate))
  const diff = referenceDay - startDay
  return Math.max(1, Math.min(30, diff + 1))
}

export function formatCooldown(ms: number): string {
  if (ms <= 0) return '0min'
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 0) return `${hours}h ${minutes}min`
  return `${minutes}min`
}

export function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `${minutes}min atrás`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h atrás`
  const days = Math.floor(hours / 24)
  return `${days}d atrás`
}
