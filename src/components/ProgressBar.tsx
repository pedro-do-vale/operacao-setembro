import { useEffect, useRef } from 'react'
import { RANKS } from '../config/ranks'
import { getRankById, getNextRank, getDaysUntilNextRank } from '../utils/ranks'
import type { RankDefinition } from '../types'

interface ProgressBarProps {
  days: number
  rankId: string
}

type MilestoneState = 'completed' | 'current' | 'upcoming'

function getMilestoneState(rankId: string, currentRankId: string): MilestoneState {
  const currentIndex = RANKS.findIndex((r) => r.id === currentRankId)
  const rankIndex = RANKS.findIndex((r) => r.id === rankId)
  if (rankIndex < currentIndex) return 'completed'
  if (rankIndex === currentIndex) return 'current'
  return 'upcoming'
}

function MilestoneIcon({ rank }: { rank: RankDefinition }) {
  if (rank.id === 'general') {
    return (
      <span className="rank-timeline__icon rank-timeline__icon--stars" aria-hidden="true">
        <span>⭐</span>
        <span>⭐</span>
        <span>⭐</span>
      </span>
    )
  }

  return (
    <span className="rank-timeline__icon" aria-hidden="true">
      {rank.icon}
    </span>
  )
}

export function ProgressBar({ days, rankId }: ProgressBarProps) {
  const nextRank = getNextRank(rankId)
  const daysLeft = getDaysUntilNextRank(days)
  const trackRef = useRef<HTMLOListElement>(null)
  const currentRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    const track = trackRef.current
    const current = currentRef.current
    if (!track || !current) return

    const target =
      current.offsetLeft - track.clientWidth / 2 + current.offsetWidth / 2
    track.scrollTo({ left: Math.max(0, target), behavior: 'smooth' })
  }, [rankId])

  return (
    <div className="rank-timeline">
      <ol ref={trackRef} className="rank-timeline__track" aria-label="Progresso por patente">
        {RANKS.map((rank, index) => {
          const state = getMilestoneState(rank.id, rankId)
          const isLast = index === RANKS.length - 1

          return (
            <li
              key={rank.id}
              ref={state === 'current' ? currentRef : undefined}
              className={`rank-timeline__item rank-timeline__item--${state}`}
            >
              <div className="rank-timeline__node-wrap">
                <span
                  className="rank-timeline__node"
                  aria-current={state === 'current' ? 'step' : undefined}
                  title={`${rank.name} (dia ${rank.minDays}–${rank.maxDays})`}
                >
                  <MilestoneIcon rank={rank} />
                </span>
                {!isLast && <span className="rank-timeline__connector" aria-hidden="true" />}
              </div>
              <span className="rank-timeline__name">{rank.name}</span>
              <span className="rank-timeline__days">D{rank.minDays}</span>
            </li>
          )
        })}
      </ol>

      {nextRank ? (
        <p className="rank-timeline__label">
          {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'} para {nextRank.name}
        </p>
      ) : (
        <p className="rank-timeline__label">Patente máxima alcançada</p>
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
