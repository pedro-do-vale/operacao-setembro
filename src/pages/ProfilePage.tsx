import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCampaign } from '../contexts/CampaignContext'
import { useAuth } from '../contexts/AuthContext'
import { AvatarRenderer } from '../components/AvatarRenderer'
import { ProgressBar, RankBadge } from '../components/ProgressBar'
import { logoutUser } from '../services/authService'
import { setEpitaph } from '../services/campaignService'
import { getRankById } from '../utils/ranks'
import { ACHIEVEMENTS } from '../config/achievements'
import { EPITAPH_SUGGESTIONS, GAME_CONFIG } from '../config/gameConfig'

export function ProfilePage() {
  const { player, playerRank, campaign } = useCampaign()
  const { userProfile } = useAuth()
  const [epitaph, setEpitaphText] = useState(player?.epitaph ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSaveEpitaph() {
    if (!campaign || !player) return
    setSaving(true)
    try {
      await setEpitaph(campaign.id, epitaph)
    } finally {
      setSaving(false)
    }
  }

  if (!player || !userProfile) {
    return (
      <div className="page">
        <p className="empty-state">Entre na campanha para ver seu perfil.</p>
      </div>
    )
  }

  const avatarConfig = player.status === 'fallen' && player.avatarSnapshotAtDeath
    ? player.avatarSnapshotAtDeath
    : player.avatarConfig
  const displayedRankId = player.status === 'fallen'
    ? (player.rankAtDeath ?? player.currentRank)
    : player.currentRank

  const unlockedAchievements = ACHIEVEMENTS.filter((a) => a.condition(player))

  return (
    <div className="page profile-page">
      <header className="page-header profile-page__header">
        <h1>PERFIL DO GUERREIRO</h1>
      </header>

      <div className="profile-card">
        <div className="profile-hero" aria-label={`Personagem ${player.nickname}`}>
          <div className="profile-hero__halo" />
          <AvatarRenderer
            avatarConfig={avatarConfig}
            rankId={displayedRankId}
            status={player.status}
            size="xl"
            className="profile-hero__avatar"
          />
          <div className="profile-hero__ground" />
        </div>

        <div className="profile-card__identity">
          <p className="profile-card__eyebrow">GUERREIRO EM COMBATE</p>
          <h2>{player.nickname}</h2>

        {player.status === 'alive' && (
          <>
            <RankBadge rankId={player.currentRank} />
            <p className="profile-card__days">{player.daysSurvived} DIAS DE COMBATE</p>
            <div className="profile-card__progress">
              <ProgressBar days={player.daysSurvived} rankId={player.currentRank} />
            </div>
            <div className="profile-card__meta">
              <span className="status-badge status-badge--alive">🔥 EM COMBATE</span>
              {playerRank > 0 && <span>RANKING #{playerRank}</span>}
            </div>
          </>
        )}

        {player.status === 'monk' && (
          <>
            <span className="status-badge status-badge--monk">∞ MONGE</span>
            <p>30 DIAS DE COMBATE — VOCÊ TRANSCENDEU</p>
          </>
        )}

        {player.status === 'fallen' && (
          <>
            <span className="status-badge status-badge--fallen">💀 MORTO EM COMBATE</span>
            <p>Caiu no dia {player.fallenDay}</p>
            <p>{player.fallenDay} dias sobrevividos</p>
            <p>Patente final: {getRankById(player.rankAtDeath!).name}</p>

            <div className="epitaph-section">
              <label htmlFor="epitaph">Epitáfio</label>
              <textarea
                id="epitaph"
                value={epitaph}
                onChange={(e) => setEpitaphText(e.target.value.slice(0, GAME_CONFIG.EPITAPH_MAX_LENGTH))}
                maxLength={GAME_CONFIG.EPITAPH_MAX_LENGTH}
                rows={2}
                placeholder="Sua última palavra..."
              />
              <div className="epitaph-suggestions">
                {EPITAPH_SUGGESTIONS.map((s) => (
                  <button key={s} type="button" className="quick-message-btn" onClick={() => setEpitaphText(s)}>
                    {s}
                  </button>
                ))}
              </div>
              <button className="btn btn--secondary" onClick={handleSaveEpitaph} disabled={saving}>
                {saving ? 'SALVANDO...' : 'SALVAR EPITÁFIO'}
              </button>
            </div>
          </>
        )}
        </div>
      </div>

      <Link to="/evolucao" className="profile-evolution-link">
        <span>
          <small>GALERIA DE PATENTES</small>
          <strong>VEJA SUA PRÓXIMA EVOLUÇÃO</strong>
        </span>
        <span aria-hidden="true">→</span>
      </Link>

      {unlockedAchievements.length > 0 && (
        <section className="achievements-section">
          <h3>Conquistas</h3>
          <div className="achievements-grid">
            {unlockedAchievements.map((a) => (
              <div key={a.id} className="achievement-badge">
                <span>{a.icon}</span>
                <strong>{a.name}</strong>
                <small>{a.description}</small>
              </div>
            ))}
          </div>
        </section>
      )}

      <button className="btn btn--secondary btn--full" onClick={() => logoutUser()}>
        SAIR
      </button>
    </div>
  )
}
