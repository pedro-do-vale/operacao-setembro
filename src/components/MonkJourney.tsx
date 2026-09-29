import { useEffect, useState } from 'react'
import type { Campaign, CampaignPlayer, FeedEvent, SupportRequest } from '../types'
import { getFeedHistory } from '../services/feedService'
import { getSupportHistory } from '../services/supportService'
import { buildMonkJourney } from '../utils/monkJourney'
import { AvatarRenderer } from './AvatarRenderer'
import { MonkShareCard } from './MonkShareCard'
import { buildAvatarConfigForRank } from '../utils/ranks'

export function MonkJourney({ campaign, player, players, onComplete }: { campaign: Campaign; player: CampaignPlayer; players: CampaignPlayer[]; onComplete: () => void }) {
  const [history, setHistory] = useState<{ feed: FeedEvent[]; requests: SupportRequest[] } | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    Promise.all([getFeedHistory(campaign.id), getSupportHistory(campaign.id)]).then(([feed, requests]) => {
      if (active) setHistory({ feed, requests })
    }).catch(() => { if (active) setError('Não foi possível carregar os acontecimentos. Tente novamente para ver sua história completa.') })
    return () => { active = false }
  }, [campaign.id, attempt])

  const days = history ? buildMonkJourney(campaign, player, players, history.feed, history.requests) : []
  return <section className="monk-journey">
    <header className="monk-journey__header">
      <p className="monk-eyebrow">A ÚLTIMA TRAVESSIA · {player.nickname}</p>
      <h1 id="ceremony-title">Sua trajetória</h1>
      <p>30 dias que fizeram de você um Monge.</p>
      <p className="monk-journey__hint">Deslize para reviver cada dia ↓</p>
    </header>
    {!history && !error && <p role="status">Reunindo as memórias da campanha...</p>}
    {error && <div role="alert"><p>{error}</p><button className="btn btn--secondary" onClick={() => { setError(''); setAttempt(value => value + 1) }}>TENTAR NOVAMENTE</button></div>}
    {history && <>
      <p className="monk-journey__note">As patentes marcam os dias sobrevividos. Os registros mostram quando cada acontecimento foi confirmado, incluindo as últimas horas antes da ascensão.</p>
      <ol className="monk-journey__timeline">
        {days.map(day => <li key={day.day} className={`monk-journey__day ${day.milestone ? 'monk-journey__day--milestone' : ''}`}>
          <div className="monk-journey__marker" aria-hidden="true">{String(day.day).padStart(2, '0')}</div>
          <div className="monk-journey__day-heading"><strong>DIA {String(day.day).padStart(2, '0')}</strong><time dateTime={day.date}>{day.date.slice(5).split('-').reverse().join('/')}</time></div>
          {day.milestone ? <div className="monk-journey__rank">
            <AvatarRenderer avatarConfig={buildAvatarConfigForRank(day.rank.id, player.avatarBase)} rankId={day.rank.id} status={day.day === 30 ? 'monk' : 'alive'} size="sm" />
            <div><span className="monk-eyebrow">{day.day === 1 ? 'O PRIMEIRO PASSO' : day.day === 30 ? 'O DESTINO DA TRAVESSIA' : 'MARCO DA PROGRESSÃO'}</span><h2>{day.rank.name}</h2></div>
          </div> : <p className="monk-journey__rank-label">{day.rank.icon} {day.rank.name} · Você permaneceu firme.</p>}
          {day.events.length > 0 ? <ul className="monk-journey__events">{day.events.map(event => <li key={event.id} className={`monk-journey__event monk-journey__event--${event.kind}`}>
            <span aria-hidden="true">{event.kind === 'fallen' ? '✝' : event.kind === 'support' ? '⚑' : '✦'}</span>
            <div><h3>{event.title}</h3>{event.detail && <p>{event.detail}</p>}<time dateTime={event.timestamp.toISOString()}>{event.timestamp.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</time></div>
          </li>)}</ul> : <p className="monk-journey__quiet">Nenhum acontecimento registrado neste dia.</p>}
        </li>)}
      </ol>
      <footer className="monk-journey__finish">
        <span aria-hidden="true">∞</span>
        <h2>Você chegou até aqui.</h2>
        <p>Sua história merece ser compartilhada.</p>
        <MonkShareCard player={player} campaignName={campaign.name} shareAction />
        <button className="btn btn--secondary" onClick={onComplete}>VOLTAR À CONQUISTA</button>
      </footer>
    </>}
  </section>
}
