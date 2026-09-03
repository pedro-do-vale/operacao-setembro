import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleCheck, Clock3, LoaderCircle, Radio, ShieldCheck, Skull } from 'lucide-react'
import { useCampaign } from '../contexts/CampaignContext'
import { useAuth } from '../contexts/AuthContext'
import { AvatarRenderer } from '../components/AvatarRenderer'
import { ProgressBar, RankBadge } from '../components/ProgressBar'
import { Modal } from '../components/Modal'
import { performCheckIn, declareFall, joinCampaign } from '../services/campaignService'
import { createSupportRequest, getSupportCooldownRemaining, isSupportAlertVisible, subscribeToSupportRequests } from '../services/supportService'
import { getCampaignDay, formatCooldown } from '../utils/dates'
import { getCheckInAvailability } from '../utils/checkIn'
import { GAME_CONFIG } from '../config/gameConfig'
import {
  isRegistrationOpen,
  getSelectableStartDateKeys,
  formatStartDateLabel,
  calculateInitialDaysSurvived,
} from '../utils/campaignJoin'
import { getRankById, getRankForDays } from '../utils/ranks'
import { SupportRequestCard } from '../components/SupportRequestCard'
import { useEffect } from 'react'
import type { SupportRequest } from '../types'

export function BattlePage() {
  const { campaign, player, aliveCount, playerRank, loading } = useCampaign()
  const { userProfile } = useAuth()
  const navigate = useNavigate()

  const [checkInLoading, setCheckInLoading] = useState(false)
  const [fallModalOpen, setFallModalOpen] = useState(false)
  const [supportModalOpen, setSupportModalOpen] = useState(false)
  const [promotionModal, setPromotionModal] = useState<string | null>(null)
  const [deathResult, setDeathResult] = useState<typeof player>(null)
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([])
  const [cooldown, setCooldown] = useState(0)
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)
  const [personalStartDate, setPersonalStartDate] = useState('')
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!campaign) return
    const unsub = subscribeToSupportRequests(campaign.id, setSupportRequests)
    return unsub
  }, [campaign])

  useEffect(() => {
    if (!campaign || player) return
    const deadline = campaign.registrationDeadline ?? GAME_CONFIG.REGISTRATION_DEADLINE
    const options = getSelectableStartDateKeys(campaign.startDate, deadline)
    if (options.length > 0 && !personalStartDate) {
      setPersonalStartDate(options[options.length - 1])
    }
  }, [campaign, player, personalStartDate])

  useEffect(() => {
    const updateCooldown = () => {
      setCooldown(getSupportCooldownRemaining(player?.lastSupportRequestAt))
      setNow(Date.now())
    }
    const interval = setInterval(updateCooldown, 60000)
    updateCooldown()
    return () => clearInterval(interval)
  }, [player?.lastSupportRequestAt])

  async function handleJoin() {
    if (!campaign || !userProfile || !personalStartDate) return
    setJoining(true)
    setError('')
    try {
      await joinCampaign(
        campaign.id,
        userProfile.uid,
        userProfile.nickname,
        userProfile.avatarBase,
        personalStartDate
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar na campanha')
    } finally {
      setJoining(false)
    }
  }

  async function handleCheckIn() {
    if (!campaign || !player) return
    setCheckInLoading(true)
    setError('')
    try {
      const result = await performCheckIn(campaign.id)
      if (result.promoted && result.newRank) {
        setPromotionModal(result.newRank)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no check-in')
    } finally {
      setCheckInLoading(false)
    }
  }

  async function handleFall() {
    if (!campaign) return
    try {
      const fallen = await declareFall(campaign.id)
      setFallModalOpen(false)
      setDeathResult(fallen)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar queda')
    }
  }

  async function handleSupportRequest() {
    if (!campaign) return
    setError('')
    try {
      await createSupportRequest(campaign.id)
      setSupportModalOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao pedir reforço')
    }
  }

  if (loading) return <div className="page-loading">Carregando batalha...</div>

  if (!campaign) {
    return (
      <div className="page join-campaign">
        <h1>OPERAÇÃO SETEMBRO</h1>
        <p className="join-campaign__subtitle">Campanha não encontrada</p>
        <p className="empty-state">
          A campanha ainda não foi configurada no Firestore. Peça ao admin para criar o documento{' '}
          <strong>campaigns/operacao-setembro-2026</strong> ou rode <code>npm run seed:campaign</code>.
        </p>
      </div>
    )
  }

  if (!player) {
    const deadline = campaign.registrationDeadline ?? GAME_CONFIG.REGISTRATION_DEADLINE
    const registrationOpen = isRegistrationOpen(new Date(), deadline)

    if (!registrationOpen) {
      return (
        <div className="page join-campaign">
          <h1>OPERAÇÃO SETEMBRO</h1>
          <p className="join-campaign__subtitle">Inscrições encerradas</p>
          <p className="empty-state">O prazo para entrar na campanha era até 04/09.</p>
        </div>
      )
    }

    const startDateOptions = getSelectableStartDateKeys(campaign.startDate, deadline)
    const selectedDays = personalStartDate
      ? calculateInitialDaysSurvived(campaign.startDate, personalStartDate)
      : 0
    const previewRank = getRankForDays(selectedDays)

    return (
      <div className="page join-campaign">
        <h1>OPERAÇÃO SETEMBRO</h1>
        <p className="join-campaign__subtitle">Primeira vez na campanha</p>
        <div className="join-campaign__rule">
          <p><strong>CAIU, ACABOU.</strong></p>
          <p>Uma campanha. Uma tentativa. Uma vida.</p>
        </div>

        <div className="form-group">
          <label>Quando você começou o desafio?</label>
          <p className="form-hint">Escolha o dia em que você iniciou. Os dias anteriores contam como sobrevividos.</p>
          <div className="start-date-picker">
            {startDateOptions.map((dateKey) => (
              <button
                key={dateKey}
                type="button"
                className={`start-date-picker__option ${personalStartDate === dateKey ? 'start-date-picker__option--selected' : ''}`}
                onClick={() => setPersonalStartDate(dateKey)}
              >
                {formatStartDateLabel(dateKey, campaign.startDate)}
              </button>
            ))}
          </div>
        </div>

        {personalStartDate && (
          <div className="join-campaign__preview">
            <p>{selectedDays} {selectedDays === 1 ? 'dia' : 'dias'} de combate retroativos</p>
            <p>Patente inicial: <strong>{previewRank.name}</strong></p>
            <p className="form-hint">O dia de hoje só poderá ser confirmado amanhã.</p>
          </div>
        )}

        {userProfile && personalStartDate && (
          <AvatarRenderer
            avatarConfig={{ base: userProfile.avatarBase, armor: 'basic' }}
            rankId={previewRank.id}
            size="lg"
          />
        )}

        {error && <p className="form-error">{error}</p>}
        <button
          className="btn btn--primary btn--full"
          onClick={handleJoin}
          disabled={joining || !personalStartDate}
        >
          {joining ? 'ENTRANDO...' : '⚔️ ENTRAR NA CAMPANHA'}
        </button>
      </div>
    )
  }

  const campaignDay = getCampaignDay(campaign.startDate)
  const avatarConfig = player.status === 'fallen' && player.avatarSnapshotAtDeath
    ? player.avatarSnapshotAtDeath
    : player.avatarConfig
  const checkInState = getCheckInAvailability({
    personalStartDate: player.personalStartDate,
    lastConfirmedDate: player.lastConfirmedDate,
  })
  const otherRequests = supportRequests.filter(
    (r) => r.playerId !== player.id && isSupportAlertVisible(r.createdAt, new Date(now))
  )

  if (deathResult) {
    const deathRank = getRankById(deathResult.rankAtDeath ?? deathResult.currentRank)
    return (
      <div className="page death-screen">
        <div className="death-screen__content">
          <span className="death-screen__icon">💀</span>
          <h1>BAIXA CONFIRMADA</h1>
          <AvatarRenderer avatarConfig={avatarConfig} rankId={deathResult.rankAtDeath ?? deathResult.currentRank} status="fallen" size="xl" />
          <h2>{deathResult.nickname}</h2>
          <p className="death-screen__days">{deathResult.fallenDay} DIAS DE COMBATE</p>
          <p className="death-screen__rank">PATENTE FINAL</p>
          <p className="death-screen__rank-name">{deathRank.name.toUpperCase()}</p>
          <p className="death-screen__message">A campanha acabou para você.</p>
          <button
            className="btn btn--secondary"
            onClick={() => navigate('/cemiterio', { state: { highlightId: deathResult.id } })}
          >
            VISITAR MEU TÚMULO
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`page battle-page ${player.status === 'fallen' ? 'battle-page--fallen' : ''}`}>
      <header className="battle-page__header">
        <h1>OPERAÇÃO SETEMBRO</h1>
        <p className="battle-page__day">DIA {campaignDay} / {GAME_CONFIG.CAMPAIGN_DURATION_DAYS}</p>
        <p className="battle-page__survivors">⚔️ {aliveCount} GUERREIROS RESTANTES</p>
      </header>

      <div className="battle-card">
        <AvatarRenderer avatarConfig={avatarConfig} rankId={player.currentRank} status={player.status} size="xl" />
        <h2 className="battle-card__nickname">{player.nickname}</h2>
        <RankBadge rankId={player.currentRank} />
        <p className="battle-card__days">{player.daysSurvived} DIAS DE COMBATE</p>
        {player.status === 'alive' && (
          <ProgressBar days={player.daysSurvived} rankId={player.currentRank} />
        )}
        {playerRank > 0 && (
          <p className="battle-card__ranking">Ranking #{playerRank}</p>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}

      {player.status === 'alive' && (
        <div className="battle-actions">
          <button
            className="btn btn--full battle-action battle-action--checkin"
            onClick={handleCheckIn}
            disabled={checkInLoading || !checkInState.canCheckIn}
          >
            <span className="battle-action__icon" aria-hidden="true">
              {checkInLoading ? (
                <LoaderCircle className="battle-action__spinner" />
              ) : checkInState.reason === 'already-confirmed' ? (
                <CircleCheck />
              ) : checkInState.reason === 'too-early' ? (
                <Clock3 />
              ) : (
                <ShieldCheck />
              )}
            </span>
            <span className="battle-action__copy">
              <span className="battle-action__label">
                {checkInLoading
                  ? 'REGISTRANDO...'
                  : checkInState.reason === 'already-confirmed'
                    ? 'ONTEM CONFIRMADO'
                    : checkInState.reason === 'too-early'
                      ? 'LIBERA À MEIA-NOITE'
                      : 'SOBREVIVI ONTEM'}
              </span>
              <span className="battle-action__hint">
                {checkInState.canCheckIn ? 'Confirmar mais um dia de campanha' : 'Check-in diário indisponível'}
              </span>
            </span>
          </button>

          <button
            className="btn btn--full battle-action battle-action--support"
            onClick={() => setSupportModalOpen(true)}
            disabled={cooldown > 0}
          >
            <span className="battle-action__icon" aria-hidden="true"><Radio /></span>
            <span className="battle-action__copy">
              <span className="battle-action__label">PEDIR REFORÇO</span>
              <span className="battle-action__hint">Acionar sua rede de apoio</span>
            </span>
          </button>
          {cooldown > 0 && (
            <p className="cooldown-text">
              Você poderá pedir reforço novamente em {formatCooldown(cooldown)}
            </p>
          )}

          <button
            className="btn btn--full battle-action battle-action--fallen"
            onClick={() => setFallModalOpen(true)}
          >
            <span className="battle-action__icon" aria-hidden="true"><Skull /></span>
            <span className="battle-action__copy">
              <span className="battle-action__label">CAÍ EM COMBATE</span>
              <span className="battle-action__hint">Encerrar minha participação</span>
            </span>
          </button>
        </div>
      )}

      {otherRequests.length > 0 && (
        <section className="battle-support-alerts">
          <h3>🚨 Alertas de Batalha</h3>
          {otherRequests.map((req) => (
            <SupportRequestCard key={req.id} request={req} />
          ))}
        </section>
      )}

      <Modal open={fallModalOpen} onClose={() => setFallModalOpen(false)} title="TEM CERTEZA?" variant="danger">
        <p className="modal-text">
          Sua participação nesta campanha será encerrada permanentemente.
          Você será enviado ao Cemitério e não poderá retornar até a próxima campanha.
        </p>
        <div className="modal-actions">
          <button className="btn btn--secondary" onClick={() => setFallModalOpen(false)}>
            CANCELAR
          </button>
          <button className="btn btn--danger" onClick={handleFall}>
            💀 CONFIRMAR MINHA QUEDA
          </button>
        </div>
      </Modal>

      <Modal open={supportModalOpen} onClose={() => setSupportModalOpen(false)} title="🚨 PEDIR REFORÇO?" variant="default">
        <p className="modal-text">
          Os outros guerreiros serão avisados de que você está sob ataque.
        </p>
        <div className="modal-actions">
          <button className="btn btn--secondary" onClick={() => setSupportModalOpen(false)}>
            CANCELAR
          </button>
          <button className="btn btn--support" onClick={handleSupportRequest}>
            🚨 CHAMAR REFORÇOS
          </button>
        </div>
      </Modal>

      <Modal
        open={!!promotionModal}
        onClose={() => setPromotionModal(null)}
        title="PROMOÇÃO!"
        variant="promotion"
      >
        {promotionModal && (
          <div className="promotion-modal">
            <p className="promotion-modal__stars">⭐⭐⭐</p>
            <h2>{getRankById(promotionModal).name.toUpperCase()}</h2>
            <AvatarRenderer
              avatarConfig={player.avatarConfig}
              rankId={promotionModal}
              status={player.status}
              size="lg"
            />
            <p>Novo equipamento desbloqueado!</p>
            <button className="btn btn--primary" onClick={() => setPromotionModal(null)}>
              CONTINUAR
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
