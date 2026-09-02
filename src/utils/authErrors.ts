const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/operation-not-allowed':
    'Login por e-mail ainda não está ativado no Firebase. Peça ao admin para habilitar E-mail/Senha em Authentication → Sign-in method.',
  'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
  'auth/invalid-email': 'E-mail inválido.',
  'auth/weak-password': 'Senha muito fraca. Use pelo menos 6 caracteres.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
  'auth/network-request-failed': 'Sem conexão. Verifique sua internet.',
}

export function getAuthErrorMessage(error: unknown, fallback = 'Erro de autenticação'): string {
  if (!(error instanceof Error)) return fallback

  const codeMatch = error.message.match(/\(auth\/[^)]+\)/)
  if (codeMatch) {
    const code = codeMatch[0].slice(1, -1)
    if (AUTH_ERROR_MESSAGES[code]) return AUTH_ERROR_MESSAGES[code]
  }

  if (error.message.includes('Firebase não configurado')) {
    return 'App não conectado ao Firebase. Verifique as variáveis de ambiente.'
  }

  return error.message.replace(/^Firebase:\s*/i, '')
}
