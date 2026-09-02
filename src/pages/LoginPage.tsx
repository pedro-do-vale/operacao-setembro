import { useState } from 'react'
import { Link } from 'react-router-dom'
import { loginUser } from '../services/authService'
import { isDemoMode } from '../lib/firebase'
import { demoAuth } from '../services/demo/demoAuth'
import { isRegistrationOpen } from '../utils/campaignJoin'
import { getAuthErrorMessage } from '../utils/authErrors'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await loginUser(email, password)
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Credenciais inválidas'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page__hero">
        <span className="auth-page__logo">⚔️</span>
        <h1>OPERAÇÃO SETEMBRO</h1>
        <p className="auth-page__tagline">30 dias. 1 objetivo. Só os fortes viram Monge.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
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
            autoComplete="current-password"
          />
        </div>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
          {loading ? 'ENTRANDO...' : '⚔️ ENTRAR NA BATALHA'}
        </button>
      </form>

      <div className="auth-page__links">
        {isRegistrationOpen() && <Link to="/register">Criar conta</Link>}
        <Link to="/forgot-password">Esqueci minha senha</Link>
      </div>

      {isDemoMode && (
        <div className="demo-accounts">
          <p className="demo-accounts__label">Contas demo (senha: demo123)</p>
          <div className="demo-accounts__list">
            {demoAuth.getDemoAccounts().map((acc) => (
              <button
                key={acc.email}
                type="button"
                className="quick-message-btn"
                onClick={() => { setEmail(acc.email); setPassword('demo123') }}
              >
                {acc.nickname}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
