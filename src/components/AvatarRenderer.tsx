import { AVATAR_CANVAS, getPortraitFilenameForBase, RANK_ART_BY_ID } from '../config/avatarArt'
import type { CSSProperties } from 'react'
import type { AvatarConfig } from '../types'

const SPRITE_MODULES = import.meta.glob('../assets/sprites/**/*.svg', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>

const PORTRAIT_MODULES = import.meta.glob([
  '../assets/characters/ranks/*/portrait.png',
  '../assets/characters/ranks/*/portrait-base-b.png',
], {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>

function getSpriteUrl(category: string, name: string): string | null {
  const key = `../assets/sprites/${category}/${name}.svg`
  return SPRITE_MODULES[key] ?? null
}

interface AvatarRendererProps {
  avatarConfig: AvatarConfig
  status?: 'alive' | 'fallen' | 'monk'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  rankId?: string
  className?: string
}

export function AvatarRenderer({
  avatarConfig,
  status = 'alive',
  size = 'md',
  rankId,
  className = '',
}: AvatarRendererProps) {
  const portraitId = avatarConfig.portrait ?? (rankId ? RANK_ART_BY_ID[rankId]?.portrait : undefined)
  const portraitFilename = getPortraitFilenameForBase(avatarConfig.base)
  const portraitUrl = portraitId
    ? PORTRAIT_MODULES[`../assets/characters/ranks/${portraitId}/${portraitFilename}`]
      ?? PORTRAIT_MODULES[`../assets/characters/ranks/${portraitId}/portrait.png`]
    : undefined

  const layerDefs: { key: string; category: string; name: string }[] = [
    ...(avatarConfig.cape ? [{ key: 'cape', category: 'capes', name: avatarConfig.cape }] : []),
    { key: 'base', category: 'base', name: avatarConfig.body ?? avatarConfig.base },
  ]

  if (avatarConfig.face) layerDefs.push({ key: 'face', category: 'face', name: avatarConfig.face })
  if (avatarConfig.hair) layerDefs.push({ key: 'hair', category: 'hair', name: avatarConfig.hair })
  if (avatarConfig.legs) layerDefs.push({ key: 'legs', category: 'legs', name: avatarConfig.legs })
  if (avatarConfig.boots) layerDefs.push({ key: 'boots', category: 'boots', name: avatarConfig.boots })
  if (avatarConfig.torso) layerDefs.push({ key: 'torso', category: 'torso', name: avatarConfig.torso })
  if (avatarConfig.armor) layerDefs.push({ key: 'armor', category: 'armor', name: avatarConfig.armor })
  if (avatarConfig.belt) layerDefs.push({ key: 'belt', category: 'belts', name: avatarConfig.belt })
  if (avatarConfig.shoulders) layerDefs.push({ key: 'shoulders', category: 'shoulders', name: avatarConfig.shoulders })
  if (avatarConfig.weapon) layerDefs.push({ key: 'weapon', category: 'weapons', name: avatarConfig.weapon })
  const headgear = avatarConfig.headgear ?? avatarConfig.head
  if (headgear) layerDefs.push({ key: 'headgear', category: 'head', name: headgear })
  avatarConfig.effects?.forEach((effect) => {
    layerDefs.push({ key: `effect-${effect}`, category: 'effects', name: effect })
  })

  return (
    <div
      className={`avatar-renderer avatar-renderer--${size} avatar-renderer--${status} ${portraitUrl ? 'avatar-renderer--portrait' : 'avatar-renderer--layers'} ${className}`}
      style={{ '--avatar-canvas': `${AVATAR_CANVAS.width}` } as CSSProperties}
      aria-hidden="true"
    >
      {portraitUrl ? (
        <img
          src={portraitUrl}
          alt=""
          className="avatar-renderer__layer avatar-renderer__layer--portrait"
        />
      ) : layerDefs.map(({ key, category, name }) => {
        const url = getSpriteUrl(category, name)
        if (!url) return null
        return (
          <img
            key={key}
            src={url}
            alt=""
            className={`avatar-renderer__layer avatar-renderer__layer--${key}`}
          />
        )
      })}
      {status === 'fallen' && <div className="avatar-renderer__skull">💀</div>}
    </div>
  )
}
