import { useEffect, useState } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import { Modal } from './Modal'
import { SupportComposeForm } from './SupportComposeForm'
import {
  strengthenWarrior,
  subscribeToSupporters,
  isSupportAlertVisible,
  getSupportImageUrl,
} from '../services/supportService'
import { useCampaign } from '../contexts/CampaignContext'
import type { SupportRequest, Supporter } from '../types'
import { getRankById } from '../utils/ranks'
import { QUICK_SUPPORT_MESSAGES } from '../config/gameConfig'

interface SupportRequestCardProps {
  request: SupportRequest
}

export function SupportRequestCard({ request }: SupportRequestCardProps) {
  const { campaign, player } = useCampaign()
  const [modalOpen, setModalOpen] = useState(false)
  const [supporters, setSupporters] = useState<Supporter[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [canStrengthen, setCanStrengthen] = useState(() => isSupportAlertVisible(request.createdAt))
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerTitle, setViewerTitle] = useState('')
  const [viewerUrl, setViewerUrl] = useState('')
  const [viewerLoading, setViewerLoading] = useState(false)
  const [viewerError, setViewerError] = useState('')

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
  const requestMessage = request.message?.trim() ?? ''
  const hasRequestPlea = Boolean(requestMessage || request.hasImage)

  async function handleStrengthen(payload: { message: string; imageFile?: File }) {
    if (!campaign) return
    setLoading(true)
    setError('')
    try {
      await strengthenWarrior(campaign.id, request.id, payload)
      setModalOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fortalecer')
    } finally {
      setLoading(false)
    }
  }

  async function openViewer(title: string, target: { hasImage?: boolean; imagePath?: string }) {
    setViewerTitle(title)
    setViewerOpen(true)
    setViewerUrl('')
    setViewerError('')
    setViewerLoading(true)
    try {
      const url = await getSupportImageUrl(target)
      setViewerUrl(url)
    } catch (err) {
      setViewerError(err instanceof Error ? err.message : 'Não foi possível abrir a imagem')
    } finally {
      setViewerLoading(false)
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

        {hasRequestPlea && (
          <div className="support-card__plea">
            {request.hasImage ? (
              <button
                type="button"
                className="support-message__image-btn"
                onClick={() => void openViewer(`${request.nickname} enviou uma imagem`, request)}
              >
                <strong>{request.nickname}</strong>
                <span className="support-message__image-label">
                  ABRIR IMAGEM
                  <ImageIcon size={16} aria-hidden />
                </span>
              </button>
            ) : (
              <strong>{request.nickname}</strong>
            )}
            {requestMessage ? <p>"{requestMessage}"</p> : null}
          </div>
        )}

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
                {s.hasImage ? (
                  <button
                    type="button"
                    className="support-message__image-btn"
                    onClick={() => void openViewer(`${s.nickname} enviou uma imagem`, s)}
                  >
                    <strong>{s.nickname}</strong>
                    <span className="support-message__image-label">
                      ABRIR IMAGEM
                      <ImageIcon size={16} aria-hidden />
                    </span>
                  </button>
                ) : (
                  <strong>{s.nickname}</strong>
                )}
                {s.message ? <p>"{s.message}"</p> : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Fortalecer ${request.nickname}`}>
        <SupportComposeForm
          quickMessages={QUICK_SUPPORT_MESSAGES}
          intro={`Envie força para ${request.nickname}.`}
          messagePlaceholder="Sua mensagem de apoio..."
          submitLabel="🔥 ENVIAR FORÇA"
          error={error}
          loading={loading}
          onSubmit={handleStrengthen}
        />
      </Modal>

      <Modal
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        title={viewerTitle}
        className="modal--wide"
      >
        <div className="support-image-viewer">
          {viewerLoading && <p>Carregando imagem...</p>}
          {viewerError && <p className="form-error">{viewerError}</p>}
          {viewerUrl && !viewerLoading && (
            <img src={viewerUrl} alt={viewerTitle} />
          )}
        </div>
      </Modal>
    </>
  )
}
