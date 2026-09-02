import { useCampaign } from '../contexts/CampaignContext'
import { AvatarRenderer } from '../components/AvatarRenderer'
import { getRankById } from '../utils/ranks'

export function RankingPage() {
  const { ranking, loading } = useCampaign()

  if (loading) return <div className="page-loading">Carregando ranking...</div>

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="page ranking-page">
      <header className="page-header">
        <h1>🏆 SOBREVIVENTES</h1>
        <p className="page-header__subtitle">{ranking.length} guerreiros em combate</p>
      </header>

      <div className="ranking-list">
        {ranking.map((player, index) => {
          const rank = getRankById(player.currentRank)
          const isTop3 = index < 3
          return (
            <div
              key={player.id}
              className={`ranking-item ${isTop3 ? `ranking-item--top${index + 1}` : ''} ${player.status === 'monk' ? 'ranking-item--monk' : ''}`}
            >
              <span className="ranking-item__position">
                {isTop3 ? medals[index] : `#${index + 1}`}
              </span>
              <AvatarRenderer avatarConfig={player.avatarConfig} rankId={player.currentRank} status={player.status} size="sm" />
              <div className="ranking-item__info">
                <strong>{player.nickname}</strong>
                <span className="ranking-item__rank">{rank.icon} {rank.name}</span>
              </div>
              <div className="ranking-item__stats">
                <span className="ranking-item__days">{player.daysSurvived}d</span>
              </div>
            </div>
          )
        })}
      </div>

      {ranking.length === 0 && (
        <p className="empty-state">Nenhum sobrevivente na campanha.</p>
      )}
    </div>
  )
}
