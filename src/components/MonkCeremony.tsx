import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AvatarRenderer } from './AvatarRenderer'
import { MonkEnergy } from './MonkEnergy'
import { MonkJourney } from './MonkJourney'
import { RANKS } from '../config/ranks'
import { buildAvatarConfigForRank } from '../utils/ranks'
import type { Campaign, CampaignPlayer } from '../types'

export function MonkCeremony({ player, campaign, players = [], onClose, soundEnabled = false, onToggleSound }: { player: CampaignPlayer; campaign?: Campaign; players?: CampaignPlayer[]; onClose: () => void; soundEnabled?: boolean; onToggleSound?: () => void }) {
  const [showJourney, setShowJourney] = useState(false)
  const [glowFinished, setGlowFinished] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [elapsed, setElapsed] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 13500 : 0)
  const dialog = useRef<HTMLDivElement>(null)
  const revealed = elapsed >= 12000
  const cinematicFinished = elapsed >= 13500
  const rankIndex = Math.min(13, Math.floor(elapsed / 600))
  const rank = RANKS[rankIndex]

  useEffect(() => {
    if (cinematicFinished || showJourney) return
    let lastTick = Date.now()
    const timer = window.setInterval(() => {
      const now = Date.now()
      const delta = now - lastTick
      lastTick = now
      setElapsed(previous => Math.min(13500, previous + delta))
    }, 100)
    return () => window.clearInterval(timer)
  }, [cinematicFinished, showJourney])

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const root = document.getElementById('root')
    const wasInert = root?.inert ?? false
    if (root) root.inert = true
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.current?.focus()
    return () => {
      if (root) root.inert = wasInert
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [])

  return createPortal(
    <div className={`monk-ceremony ${showJourney ? 'monk-ceremony--journey' : revealed ? 'monk-ceremony--revealed' : ''}`} role="dialog" aria-modal="true" aria-labelledby="ceremony-title" tabIndex={-1} ref={dialog}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
        if (event.key === 'Tab') {
          const buttons = dialog.current?.querySelectorAll<HTMLButtonElement>('button')
          if (!buttons?.length) return
          const first = buttons[0], last = buttons[buttons.length - 1]
          if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last.focus() }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
        }
      }}>
      <div className="monk-ceremony__controls">
        <button onClick={onToggleSound} aria-pressed={soundEnabled}>{soundEnabled ? 'Silenciar' : 'Ativar som'}</button>
        <button onClick={() => {
          if (showJourney || revealed) { onClose(); return }
          setShowJourney(false)
          setGlowFinished(true)
          setElapsed(13500)
          dialog.current?.scrollTo?.({ top: 0 })
          dialog.current?.focus()
        }}>{showJourney || revealed ? 'Fechar' : 'Pular cerimônia'}</button>
      </div>
      {!showJourney && elapsed >= 8400 && !cinematicFinished && !glowFinished && <div className="monk-ceremony__ascension-glow" data-testid="ascension-glow" aria-hidden="true" />}
      <div className="monk-ceremony__content">
        {showJourney && campaign ? <MonkJourney campaign={campaign} player={player} players={players} onComplete={() => { setShowJourney(false); dialog.current?.scrollTo?.({ top: 0 }); dialog.current?.focus() }} /> : <>
        <p className="monk-eyebrow">OPERAÇÃO SETEMBRO · A ÚLTIMA TRAVESSIA</p>
        <div className={`monk-ceremony__portrait ${revealed ? 'monk-ceremony__portrait--energized' : elapsed >= 8400 ? 'monk-ceremony__portrait--dissolve' : ''}`}>
          {revealed && <><div className="evolution-card__halo" aria-hidden="true" /><MonkEnergy /></>}
          <AvatarRenderer key={revealed ? 'monge' : rank.id} avatarConfig={buildAvatarConfigForRank(revealed ? 'monge' : rank.id, player.avatarBase)} rankId={revealed ? 'monge' : rank.id} status={revealed ? 'monk' : 'alive'} size="xl" />
          {elapsed >= 8400 && !revealed && <span className="monk-ceremony__crown" aria-hidden="true">♛</span>}
        </div>
        <div aria-live="polite">
          <p className="monk-eyebrow">{revealed ? 'PATENTE MÍTICA · MONGE ∞' : elapsed >= 8400 ? 'A COROA CUMPRIU SEU PROPÓSITO' : rank.name}</p>
          <h1 id="ceremony-title">{revealed ? `${player.nickname}, você transcendeu.` : elapsed < 3000 ? 'Você começou como um soldado.' : elapsed < 8400 ? 'Voltou a lutar, dia após dia.' : 'Trinta dias. Você cumpriu sua palavra.'}</h1>
          <p className="monk-ceremony__subtitle">{revealed ? 'A maior vitória foi sobre si mesmo.' : 'Cada dia trouxe você até aqui.'}</p>
        </div>
        {revealed ? <button className="btn btn--primary" onClick={() => {
          if (!campaign) { onClose(); return }
          setGlowFinished(true)
          setShowJourney(true)
          dialog.current?.scrollTo?.({ top: 0 })
          dialog.current?.focus()
        }}>{campaign ? 'VER A MINHA TRAJETÓRIA' : 'FECHAR'}</button> : <div className="monk-ceremony__progress" aria-hidden="true"><span style={{ width: `${Math.min(100, elapsed / 120)}%` }} /></div>}
        </>}
      </div>
    </div>, document.body,
  )
}
