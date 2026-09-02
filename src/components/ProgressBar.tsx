import { getRankById, getNextRank, getDaysUntilNextRank, getRankProgress } from '../utils/ranks'

interface ProgressBarProps {
  days: number
  rankId: string
}

export function ProgressBar({ days, rankId }: ProgressBarProps) {
  const progress = getRankProgress(days)
  const nextRank = getNextRank(rankId)
  const daysLeft = getDaysUntilNextRank(days)

  return (
    <div className="progress-bar">
      <div className="progress-bar__track">
        <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
      </div>
      {nextRank ? (
        <p className="progress-bar__label">
          {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'} para {nextRank.name}
        </p>
      ) : (
        <p className="progress-bar__label">Patente máxima alcançada</p>
      )}
    </div>
  )
}

export function RankBadge({ rankId }: { rankId: string }) {
  const rank = getRankById(rankId)
  return (
    <span className={`rank-badge rank-badge--${rank.rarity}`}>
      {rank.icon} {rank.name.toUpperCase()}
    </span>
  )
}
