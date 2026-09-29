import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCampaign } from '../contexts/CampaignContext'
import { AvatarRenderer } from '../components/AvatarRenderer'
import { MonkCeremony } from '../components/MonkCeremony'
import { MonkShareCard } from '../components/MonkShareCard'
import { monkDate } from '../utils/monkCard'
import type { CampaignPlayer } from '../types'
import { useMonkSoundtrack } from '../hooks/useMonkSoundtrack'

export function MonkTemplePage() {
  const { soundEnabled, startSoundtrack, stopSoundtrack, toggleSoundtrack } = useMonkSoundtrack()
  const { players, player, campaign, loading } = useCampaign()
  const [replay, setReplay] = useState<CampaignPlayer | null>(null)
  if (loading) return <div className="page-loading">Abrindo o templo...</div>
  const monks = players.filter(p => p.status === 'monk').sort((a, b) => (a.lastCheckIn?.getTime() ?? 0) - (b.lastCheckIn?.getTime() ?? 0) || a.nickname.localeCompare(b.nickname))
  return <div className="page monk-temple">
    <header className="monk-temple__header">
      <Link to="/ranking">← Sobreviventes</Link>
      <span className="monk-temple__sigil" aria-hidden="true">∞</span>
      <p className="monk-eyebrow">{campaign?.name} · MEMÓRIA DOS QUE CHEGARAM</p>
      <h1>Templo dos Monges</h1>
      <p>Trinta dias. Uma promessa cumprida.<br />Aqui, cada nome carrega uma travessia.</p>
      <span className="monk-temple__count">{monks.length} {monks.length === 1 ? 'MONGE' : 'MONGES'} · LEGADO ETERNO</span>
    </header>
    <div className="monk-temple__grid">
      {monks.map(monk => <article className="monk-plaque" key={monk.id}>
        <p className="monk-eyebrow">MONGE ∞</p>
        <AvatarRenderer avatarConfig={monk.avatarConfig} rankId="monge" status="monk" size="xl" />
        <h2>{monk.nickname}</h2>
        <p className="monk-plaque__date">Ascensão · {monkDate(monk)}</p>
        <p>“A maior vitória foi sobre si mesmo.”</p>
        <button className="btn btn--secondary" onClick={() => { startSoundtrack(); setReplay(monk) }}>REVER TRAVESSIA</button>
        {player?.id === monk.id && <MonkShareCard player={monk} campaignName={campaign?.name ?? 'Operação Setembro'} />}
      </article>)}
    </div>
    {monks.length === 0 && <div className="monk-plaque"><h2>O templo aguarda seu primeiro nome.</h2><p>A entrada é conquistada ao confirmar o 30º dia de combate.</p><Link to="/batalha">Voltar à batalha →</Link></div>}
    {replay && <MonkCeremony player={replay} campaign={campaign ?? undefined} players={players} soundEnabled={soundEnabled} onToggleSound={toggleSoundtrack} onClose={() => { stopSoundtrack(); setReplay(null) }} />}
  </div>
}
