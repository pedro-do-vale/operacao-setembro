import type { AchievementDefinition } from '../types'

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'primeira-semana',
    name: 'Primeira Semana',
    icon: '🔥',
    description: '7 dias de combate.',
    condition: (p) => p.daysSurvived >= 7 || (p.fallenDay ?? 0) >= 7,
  },
  {
    id: 'oficial',
    name: 'Oficial',
    icon: '🎖️',
    description: 'Alcançou o oficialato.',
    condition: (p) => {
      const rank = p.rankAtDeath ?? p.currentRank
      return ['2-tenente', '1-tenente', 'capitao', 'major', 'coronel', 'general', 'rei', 'monge'].includes(rank)
    },
  },
  {
    id: 'veterano',
    name: 'Veterano',
    icon: '⚔️',
    description: '15 dias de combate.',
    condition: (p) => p.daysSurvived >= 15 || (p.fallenDay ?? 0) >= 15,
  },
  {
    id: 'top-3',
    name: 'Top 3',
    icon: '🏆',
    description: 'Alcançou o pódio.',
    condition: (p) => p.achievements.includes('top-3'),
  },
  {
    id: 'rei',
    name: 'Rei',
    icon: '👑',
    description: 'Alcançou o trono.',
    condition: (p) => (p.rankAtDeath ?? p.currentRank) === 'rei' || p.currentRank === 'rei',
  },
  {
    id: 'monge',
    name: 'Monge',
    icon: '∞',
    description: 'Chegou ao final.',
    condition: (p) => p.status === 'monk',
  },
  {
    id: 'quase-monge',
    name: 'Quase Monge',
    icon: '💀',
    description: 'Caiu depois do dia 25.',
    condition: (p) => p.status === 'fallen' && (p.fallenDay ?? 0) > 25,
  },
  {
    id: 'sob-fogo',
    name: 'Sob Fogo',
    icon: '🚨',
    description: 'Pediu reforços.',
    condition: (p) => p.achievements.includes('sob-fogo'),
  },
  {
    id: 'irmandade',
    name: 'Irmandade',
    icon: '🔥',
    description: 'Fortaleceu outros guerreiros.',
    condition: (p) => p.achievements.includes('irmandade'),
  },
]
