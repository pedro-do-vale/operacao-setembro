import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useCampaign } from '../contexts/CampaignContext'
import { AvatarRenderer } from '../components/AvatarRenderer'
import { getRankById } from '../utils/ranks'

type Filter = 'all' | 'recent' | 'survival' | 'rank'

export function GraveyardPage() {
  const { players } = useCampaign()
  const location = useLocation()
  const highlightId = (location.state as { highlightId?: string })?.highlightId

  const [filter, setFilter] = useState<Filter>('all')

  const fallen = useMemo(() => {
    let list = players.filter((p) => p.status === 'fallen')
    switch (filter) {
      case 'recent':
        list = [...list].sort((a, b) => (b.fallenAt?.getTime() ?? 0) - (a.fallenAt?.getTime() ?? 0))
        break
      case 'survival':
        list = [...list].sort((a, b) => (b.fallenDay ?? 0) - (a.fallenDay ?? 0))
        break
      case 'rank': {
        const rankOrder = ['monge', 'rei', 'general', 'coronel', 'major', 'capitao', '1-tenente', '2-tenente', 'aspirante', 'subtenente', '1-sargento', '2-sargento', '3-sargento', 'cabo', 'soldado']
        list = [...list].sort((a, b) => {
          const aIdx = rankOrder.indexOf(a.rankAtDeath ?? '')
          const bIdx = rankOrder.indexOf(b.rankAtDeath ?? '')
          return aIdx - bIdx
        })
        break
      }
      default:
        list = [...list].sort((a, b) => (b.fallenAt?.getTime() ?? 0) - (a.fallenAt?.getTime() ?? 0))
    }
    return list
  }, [players, filter])

  const stats = useMemo(() => {
    const fallenPlayers = players.filter((p) => p.status === 'fallen')
    if (fallenPlayers.length === 0) return null

    const sorted = [...fallenPlayers].sort((a, b) => (a.fallenAt?.getTime() ?? 0) - (b.fallenAt?.getTime() ?? 0))
    const bySurvival = [...fallenPlayers].sort((a, b) => (b.fallenDay ?? 0) - (a.fallenDay ?? 0))
    const byRank = [...fallenPlayers].sort((a, b) => {
      const rankOrder = ['general', 'rei', 'coronel', 'major', 'capitao']
      return rankOrder.indexOf(a.rankAtDeath ?? '') - rankOrder.indexOf(b.rankAtDeath ?? '')
    })

    const dayCounts: Record<number, number> = {}
    fallenPlayers.forEach((p) => {
      const day = p.fallenDay ?? 0
      dayCounts[day] = (dayCounts[day] ?? 0) + 1
    })
    const deadliestDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]

    return {
      total: fallenPlayers.length,
      firstFall: sorted[0],
      lastFall: sorted[sorted.length - 1],
      highestRank: byRank[0],
      longestSurvival: bySurvival[0],
      deadliestDay: deadliestDay ? { day: Number(deadliestDay[0]), count: deadliestDay[1] } : null,
    }
  }, [players])

  return (
    <div className="page graveyard-page">
      <header className="page-header graveyard-header">
        <h1>💀 CEMITÉRIO DOS GUERREIROS</h1>
        <p className="page-header__subtitle">Aqui descansam os que caíram em setembro.</p>
      </header>

      {stats && (
        <div className="graveyard-stats">
          <div className="graveyard-stat">
            <span>💀</span>
            <strong>{stats.total}</strong>
            <small>Total de baixas</small>
          </div>
          {stats.firstFall && (
            <div className="graveyard-stat">
              <span>⚔️</span>
              <strong>{stats.firstFall.nickname}</strong>
              <small>Primeira baixa</small>
            </div>
          )}
          {stats.lastFall && (
            <div className="graveyard-stat">
              <span>🕯️</span>
              <strong>{stats.lastFall.nickname}</strong>
              <small>Última baixa</small>
            </div>
          )}
          {stats.highestRank && (
            <div className="graveyard-stat">
              <span>🎖️</span>
              <strong>{getRankById(stats.highestRank.rankAtDeath!).name}</strong>
              <small>Maior patente entre os mortos</small>
            </div>
          )}
          {stats.longestSurvival && (
            <div className="graveyard-stat">
              <span>🔥</span>
              <strong>{stats.longestSurvival.fallenDay}d</strong>
              <small>Maior sobrevivência</small>
            </div>
          )}
          {stats.deadliestDay && (
            <div className="graveyard-stat">
              <span>📅</span>
              <strong>Dia {stats.deadliestDay.day}</strong>
              <small>Dia mais mortal ({stats.deadliestDay.count})</small>
            </div>
          )}
        </div>
      )}

      <div className="graveyard-filters">
        {([
          ['all', 'Todos'],
          ['recent', 'Últimas baixas'],
          ['survival', 'Maior sobrevivência'],
          ['rank', 'Maior patente'],
        ] as [Filter, string][]).map(([key, label]) => (
          <button
            key={key}
            className={`filter-btn ${filter === key ? 'filter-btn--active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="graveyard-grid">
        {fallen.map((player) => {
          const rank = getRankById(player.rankAtDeath ?? player.currentRank)
          const avatar = player.avatarSnapshotAtDeath ?? player.avatarConfig
          return (
            <div
              key={player.id}
              className={`tombstone ${highlightId === player.id ? 'tombstone--highlighted' : ''}`}
              id={`tombstone-${player.id}`}
            >
              <AvatarRenderer avatarConfig={avatar} rankId={player.rankAtDeath ?? player.currentRank} status="fallen" size="md" />
              <h3>💀 {player.nickname}</h3>
              <p className="tombstone__rank">{rank.name.toUpperCase()}</p>
              <p className="tombstone__fall">Caiu no dia {player.fallenDay}</p>
              <p className="tombstone__days">{player.fallenDay} dias sobrevividos</p>
              {player.epitaph && (
                <p className="tombstone__epitaph">"{player.epitaph}"</p>
              )}
            </div>
          )
        })}
      </div>

      {fallen.length === 0 && (
        <p className="empty-state">O cemitério está vazio. Por enquanto...</p>
      )}
    </div>
  )
}
