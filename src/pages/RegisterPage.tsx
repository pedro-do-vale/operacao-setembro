import { useState } from 'react'
import { Link } from 'react-router-dom'
import { registerUser } from '../services/authService'
import type { AvatarBase } from '../types'
import { AvatarRenderer } from '../components/AvatarRenderer'
import { getInitialAvatarConfig } from '../services/campaignService'
import { GAME_CONFIG } from '../config/gameConfig'
import { isRegistrationOpen } from '../utils/campaignJoin'
import { getAuthErrorMessage } from '../utils/authErrors'

function formatDeadlineBR(dateKey: string): string {
  const [, month, day] = dateKey.split('-')
  return `${day}/${month}`
}

export function RegisterPage() {
  const registrationOpen = isRegistrationOpen()
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [avatarBase, setAvatarBase] = useState<AvatarBase>('base-a')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!registrationOpen) {
      setError('Inscrições encerradas. O prazo era até 04/09.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }
    if (password.length < GAME_CONFIG.PASSWORD_MIN_LENGTH) {
      setError(`Senha deve ter pelo menos ${GAME_CONFIG.PASSWORD_MIN_LENGTH} caracteres`)
      return
    }
    if (nickname.length < GAME_CONFIG.NICKNAME_MIN_LENGTH) {
      setError(`Nickname deve ter pelo menos ${GAME_CONFIG.NICKNAME_MIN_LENGTH} caracteres`)
      return
    }

    setLoading(true)
    try {
      await registerUser(email, password, nickname.toUpperCase(), avatarBase)
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Erro ao criar conta'))
    } finally {
      setLoading(false)
    }
  }

  if (!registrationOpen) {
    return (
      <div className="auth-page">
        <div className="auth-page__header">
          <h1>OPERAÇÃO SETEMBRO</h1>
          <p className="auth-page__subtitle">Inscrições encerradas</p>
        </div>
        <div className="join-campaign__rule">
          <p>O prazo para criar conta era até <strong>{formatDeadlineBR(GAME_CONFIG.REGISTRATION_DEADLINE)}</strong>.</p>
          <p>Quem já tem conta pode fazer login.</p>
        </div>
        <Link to="/login" className="btn btn--primary btn--full">FAZER LOGIN</Link>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-page__header">
        <h1>OPERAÇÃO SETEMBRO</h1>
        <p className="auth-page__subtitle">Criar conta de guerreiro</p>
        <p className="auth-page__tagline">
          Inscrições até {formatDeadlineBR(GAME_CONFIG.REGISTRATION_DEADLINE)}
        </p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nickname">Nickname</label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="SEU NICK"
            maxLength={GAME_CONFIG.NICKNAME_MAX_LENGTH}
            required
          />
        </div>

        <div className="form-group">
          <label>Personagem base</label>
          <div className="avatar-picker">
            {(['base-a', 'base-b'] as AvatarBase[]).map((base) => (
              <button
                key={base}
                type="button"
                className={`avatar-picker__option ${avatarBase === base ? 'avatar-picker__option--selected' : ''}`}
                onClick={() => setAvatarBase(base)}
              >
                <AvatarRenderer avatarConfig={getInitialAvatarConfig(base)} rankId="soldado" size="md" />
                <span>{base === 'base-a' ? 'Avatar A' : 'Avatar B'}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirmar senha</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
          {loading ? 'CRIANDO...' : '⚔️ CRIAR CONTA'}
        </button>
      </form>

      <p className="auth-page__footer">
        Já tem conta? <Link to="/login">Fazer login</Link>
      </p>
    </div>
  )
}
