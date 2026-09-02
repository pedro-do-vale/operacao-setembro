export const GAME_CONFIG = {
  CAMPAIGN_DURATION_DAYS: 30,
  DEFAULT_CAMPAIGN_ID: 'operacao-setembro-2026',
  /** Último dia para criar conta e entrar na campanha (inclusive) */
  REGISTRATION_DEADLINE: '2026-09-04',
  SUPPORT_REQUEST_COOLDOWN_HOURS: 6,
  SUPPORT_MESSAGE_MAX_LENGTH: 120,
  EPITAPH_MAX_LENGTH: 80,
  NICKNAME_MIN_LENGTH: 2,
  NICKNAME_MAX_LENGTH: 20,
  PASSWORD_MIN_LENGTH: 6,
} as const

export const QUICK_SUPPORT_MESSAGES = [
  '🫡 RESISTA, SOLDADO.',
  '🔥 VOCÊ NÃO CHEGOU ATÉ AQUI PRA CAIR.',
  '⚔️ SEGURA A LINHA!',
  '🎖️ OLHE SUA PATENTE!',
  '👑 A PRÓXIMA PROMOÇÃO ESTÁ LOGO ALI.',
  '💀 NÃO VAI PRO CEMITÉRIO AGORA.',
  '🔥 AGUENTA FIRME, GUERREIRO.',
] as const

export const EPITAPH_SUGGESTIONS = [
  'Foi sem querer.',
  'Eu tentei.',
  'Até aqui eu fui guerreiro.',
  'Não tankei.',
  'Morri como Capitão.',
  'Eu achei que dava.',
] as const
