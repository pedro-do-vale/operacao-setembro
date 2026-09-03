import { useState } from 'react'
import { Modal } from './Modal'
import { strengthenWarrior, subscribeToSupporters, isSupportAlertVisible } from '../services/supportService'
import { useCampaign } from '../contexts/CampaignContext'
import { useEffect } from 'react'
import type { SupportRequest, Supporter } from '../types'
import { getRankById } from '../utils/ranks'
import { QUICK_SUPPORT_MESSAGES, GAME_CONFIG } from '../config/gameConfig'

interface SupportRequestCardProps {
  request: SupportRequest
}

export function SupportRequestCard({ request }: SupportRequestCardProps) {
  const { campaign, player } = useCampaign()
  const [modalOpen, setModalOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [supporters, setSupporters] = useState<Supporter[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [canStrengthen, setCanStrengthen] = useState(() => isSupportAlertVisible(request.createdAt))

  useEffect(() => {
    if (!campaign) return
    const unsub = subscribeToSupporters(campaign.id, request.id, setSupporters)
    return unsub
  }, [campaign, request.id])

  useEffect(() => {
    const update = () => setCanStrengthen(isSupportAlertVisible(request.createdAt))
    update()
    const interval = setInterval(update, 60_000)
    return () => clearInterval(interval)
  }, [request.createdAt])

  useEffect(() => {
    if (!canStrengthen) setModalOpen(false)
  }, [canStrengthen])

  const rank = getRankById(request.rank)
  const alreadySupported = supporters.some((s) => s.userId === player?.id)
  const isOwnRequest = player?.id === request.playerId

  async function handleStrengthen() {
    if (!campaign) return
    setLoading(true)
    setError('')
    try {
      await strengthenWarrior(campaign.id, request.id, message)
      setModalOpen(false)
      setMessage('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fortalecer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="support-card">
        <div className="support-card__header">
          <span>🚨 ALERTA DE BATALHA</span>
        </div>
        <p className="support-card__title">{request.nickname} ESTÁ SOB ATAQUE!</p>
        <p className="support-card__info">
          {request.daysSurvived} dias sobrevividos · {rank.name}
        </p>
        <p className="support-card__count">🔥 {request.supporterCount ?? supporters.length} guerreiros enviaram força</p>

        {!isOwnRequest && !alreadySupported && player && canStrengthen && (
          <button className="btn btn--support btn--full" onClick={() => setModalOpen(true)}>
            🔥 FORTALECER O GUERREIRO
          </button>
        )}

        {supporters.length > 0 && (
          <div className="support-card__messages">
            {supporters.slice(0, 3).map((s) => (
              <div key={s.id} className="support-message">
                <strong>{s.nickname}</strong>
                <p>"{s.message}"</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Fortalecer ${request.nickname}`}>
        <p>Envie força para {request.nickname}.</p>

        <div className="quick-messages">
          {QUICK_SUPPORT_MESSAGES.map((msg) => (
            <button
              key={msg}
              type="button"
              className="quick-message-btn"
              onClick={() => setMessage(msg)}
            >
              {msg}
            </button>
          ))}
        </div>

        <div className="form-group">
          <label htmlFor="support-message">DEIXE UMA MENSAGEM:</label>
          <textarea
            id="support-message"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, GAME_CONFIG.SUPPORT_MESSAGE_MAX_LENGTH))}
            maxLength={GAME_CONFIG.SUPPORT_MESSAGE_MAX_LENGTH}
            rows={3}
            placeholder="Sua mensagem de apoio..."
          />
          <span className="char-count">{message.length}/{GAME_CONFIG.SUPPORT_MESSAGE_MAX_LENGTH}</span>
        </div>

        {error && <p className="form-error">{error}</p>}

        <button
          className="btn btn--support btn--full"
          onClick={handleStrengthen}
          disabled={loading || !message.trim()}
        >
          {loading ? 'ENVIANDO...' : '🔥 ENVIAR FORÇA'}
        </button>
      </Modal>
    </>
  )
}
