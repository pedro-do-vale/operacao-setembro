import { useEffect, useState } from 'react'
import type { CampaignPlayer } from '../types'
import { renderMonkCard } from '../utils/monkCard'

export function MonkShareCard({ player, campaignName, shareAction = false }: { player: CampaignPlayer; campaignName: string; shareAction?: boolean }) {
  const [card, setCard] = useState<{ file: File; url: string } | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => () => { if (card) URL.revokeObjectURL(card.url) }, [card])

  async function prepare() {
    setBusy(true); setError('')
    try {
      const blob = await renderMonkCard(player, campaignName)
      setCard({ file: new File([blob], 'monge-operacao-setembro.png', { type: 'image/png' }), url: URL.createObjectURL(blob) })
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível gerar o cartão. Tente novamente.') }
    finally { setBusy(false) }
  }

  async function share() {
    if (!card) return
    setError('')
    try { await navigator.share({ files: [card.file], title: 'Monge ∞', text: '30 dias. Uma promessa cumprida.' }) }
    catch (cause) { if (!(cause instanceof DOMException && cause.name === 'AbortError')) setError('Não foi possível compartilhar. Você pode baixar o cartão.') }
  }

  return <div className="monk-share">
    {!card ? <button className={`btn ${shareAction ? 'btn--primary' : 'btn--secondary'}`} disabled={busy} onClick={() => void prepare()}>{busy ? 'PREPARANDO...' : shareAction ? 'COMPARTILHAR CONQUISTA' : 'CRIAR CARTÃO DA CONQUISTA'}</button> : <>
      <img className="monk-share__preview" src={card.url} alt={`Cartão de ${player.nickname}, Monge ∞. 30 dias. Uma promessa cumprida.`} />
      <div className="monk-actions">
        <a className="btn btn--secondary" href={card.url} download="monge-operacao-setembro.png">BAIXAR CARTÃO</a>
        {typeof navigator.canShare === 'function' && navigator.canShare({ files: [card.file] }) && <button className="btn btn--primary" onClick={() => void share()}>{shareAction ? 'COMPARTILHAR CONQUISTA' : 'COMPARTILHAR'}</button>}
      </div>
    </>}
    {error && <p role="alert" className="form-error">{error}</p>}
  </div>
}
