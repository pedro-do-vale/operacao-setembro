export const GAME_CONFIG = {
  CAMPAIGN_DURATION_DAYS: 30,
  DEFAULT_CAMPAIGN_ID: 'operacao-setembro-2026',
  /** Último dia para criar conta e entrar na campanha (inclusive) */
  REGISTRATION_DEADLINE: '2026-09-04',
  SUPPORT_REQUEST_COOLDOWN_HOURS: 6,
  SUPPORT_MESSAGE_MAX_LENGTH: 120,
  SUPPORT_IMAGE_MAX_INPUT_BYTES: 10 * 1024 * 1024,
  SUPPORT_IMAGE_MAX_OUTPUT_BYTES: 250 * 1024,
  SUPPORT_IMAGE_MAX_STORAGE_BYTES: 300 * 1024,
  SUPPORT_IMAGE_MAX_DIMENSION: 1280,
  SUPPORT_IMAGE_JPEG_QUALITY: 0.72,
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

export const QUICK_SUPPORT_REQUEST_MESSAGES = [
  'Estou na linha de fogo.',
  'Preciso aguentar hoje.',
  'Não quero cair agora.',
  'Manda força, guerreiros.',
] as const

export const EPITAPH_SUGGESTIONS = [
  'Foi sem querer.',
  'Eu tentei.',
  'Até aqui eu fui guerreiro.',
  'Não tankei.',
  'Morri como Capitão.',
  'Eu achei que dava.',
] as const
