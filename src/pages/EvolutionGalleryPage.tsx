import { useState } from 'react'
import { AvatarRenderer } from '../components/AvatarRenderer'
import { RANKS } from '../config/ranks'
import { RANK_ART_BY_ID } from '../config/avatarArt'
import { buildAvatarConfigForRank } from '../utils/ranks'
import type { AvatarBase } from '../types'

export function EvolutionGalleryPage() {
  const [avatarBase, setAvatarBase] = useState<AvatarBase>('base-a')

  return (
    <div className="page evolution-page">
      <header className="evolution-page__header">
        <p className="evolution-page__eyebrow">ARSENAL DE PATENTES</p>
        <h1>EVOLUÇÃO DO GUERREIRO</h1>
        <p>
          Sobreviva. Suba de patente. Desbloqueie uma nova presença no campo de batalha.
        </p>
        <div className="evolution-avatar-switch" role="group" aria-label="Identidade do avatar">
          {(['base-a', 'base-b'] as AvatarBase[]).map((base) => (
            <button
              key={base}
              type="button"
              className={avatarBase === base ? 'evolution-avatar-switch__option evolution-avatar-switch__option--active' : 'evolution-avatar-switch__option'}
              aria-pressed={avatarBase === base}
              onClick={() => setAvatarBase(base)}
            >
              Avatar {base === 'base-a' ? 'A' : 'B'}
            </button>
          ))}
        </div>
      </header>

      <div className="evolution-timeline" aria-label="Todas as patentes da campanha">
        {RANKS.map((rank, index) => {
          const art = RANK_ART_BY_ID[rank.id]
          const isMonk = rank.id === 'monge'
          return (
            <article
              key={rank.id}
              className={`evolution-card evolution-card--${rank.rarity} ${isMonk ? 'evolution-card--monk' : ''}`}
            >
              <div className="evolution-card__step">{String(index + 1).padStart(2, '0')}</div>
              <div className="evolution-card__art">
                <div className="evolution-card__halo" />
                <AvatarRenderer
                  avatarConfig={buildAvatarConfigForRank(rank.id, avatarBase)}
                  rankId={rank.id}
                  status={isMonk ? 'monk' : 'alive'}
                  size="xl"
                />
              </div>
              <div className="evolution-card__content">
                <p className="evolution-card__days">
                  DIAS {rank.minDays}–{rank.maxDays}
                </p>
                <h2>{rank.name.toUpperCase()}</h2>
                <p>{rank.description}</p>
                <div className="evolution-card__signature" aria-label="Elementos visuais">
                  {art?.signature.slice(0, 3).map((item) => (
                    <span key={item}>{item.replaceAll('-', ' ')}</span>
                  ))}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <p className="evolution-page__hint">Arraste para explorar todas as patentes →</p>
    </div>
  )
}
