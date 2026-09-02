import type { AvatarBase } from '../types'

export const AVATAR_CANVAS = {
  width: 512,
  height: 512,
  viewBox: '0 0 512 512',
  anchors: {
    center: { x: 256, y: 256 },
    feet: { x: 256, y: 494 },
    face: { x: 256, y: 92 },
    weaponHand: { x: 168, y: 258 },
  },
  layerOrder: [
    'effectsBack',
    'cape',
    'body',
    'face',
    'hair',
    'legs',
    'boots',
    'torso',
    'armor',
    'belt',
    'shoulders',
    'weapon',
    'headgear',
    'effectsFront',
  ],
} as const

export const PORTRAIT_FILENAME_BY_BASE: Record<AvatarBase, string> = {
  'base-a': 'portrait.png',
  'base-b': 'portrait-base-b.png',
}

export function getPortraitFilenameForBase(base: AvatarBase): string {
  return PORTRAIT_FILENAME_BY_BASE[base]
}

export interface RankArtDefinition {
  portrait: string
  tier: 'recruit' | 'sergeant' | 'officer' | 'elite' | 'legendary' | 'mythic'
  signature: string[]
}

export const RANK_ART_BY_ID: Record<string, RankArtDefinition> = {
  soldado: { portrait: 'soldado', tier: 'recruit', signature: ['cloth', 'leather', 'simple-sword'] },
  cabo: { portrait: 'cabo', tier: 'recruit', signature: ['chevron', 'reinforced-leather', 'iron-sword'] },
  '3-sargento': { portrait: '3-sargento', tier: 'sergeant', signature: ['light-armor', 'discreet-pauldrons', 'insignia'] },
  '2-sargento': { portrait: '2-sargento', tier: 'sergeant', signature: ['layered-armor', 'steel-sword', 'knee-guards'] },
  '1-sargento': { portrait: '1-sargento', tier: 'sergeant', signature: ['senior-pauldrons', 'veteran-medal', 'long-sword'] },
  subtenente: { portrait: 'subtenente', tier: 'officer', signature: ['refined-breastplate', 'high-collar', 'officer-sword'] },
  aspirante: { portrait: 'aspirante', tier: 'officer', signature: ['short-cape', 'officer-armor', 'aspirant-insignia'] },
  '2-tenente': { portrait: '2-tenente', tier: 'officer', signature: ['mid-cape', 'lieutenant-bar', 'refined-sword'] },
  '1-tenente': { portrait: '1-tenente', tier: 'officer', signature: ['long-cape', 'double-bar', 'large-pauldrons'] },
  capitao: { portrait: 'capitao', tier: 'elite', signature: ['captain-medal', 'full-cape', 'long-officer-sword'] },
  major: { portrait: 'major', tier: 'elite', signature: ['service-medals', 'noble-sash', 'engraved-armor'] },
  coronel: { portrait: 'coronel', tier: 'elite', signature: ['eagle-insignia', 'elite-armor', 'structured-cape'] },
  general: { portrait: 'general', tier: 'legendary', signature: ['three-stars', 'gold-pauldrons', 'legendary-sword'] },
  rei: { portrait: 'rei', tier: 'legendary', signature: ['crown', 'royal-mantle', 'royal-armor'] },
  monge: { portrait: 'monge', tier: 'mythic', signature: ['monk-robes', 'infinity-aura', 'energy'] },
}
