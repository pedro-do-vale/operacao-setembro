import { useState } from 'react'
import { Link } from 'react-router-dom'
import { resetPassword } from '../services/authService'
import { getAuthErrorMessage } from '../utils/authErrors'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Erro ao enviar e-mail'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page__header">
        <h1>Recuperar senha</h1>
        <p className="auth-page__subtitle">Enviaremos um link para seu e-mail</p>
      </div>

      {sent ? (
        <div className="auth-page__success">
          <p>✅ E-mail enviado! Verifique sua caixa de entrada.</p>
          <Link to="/login" className="btn btn--secondary">Voltar ao login</Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
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

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? 'ENVIANDO...' : 'ENVIAR LINK'}
          </button>
        </form>
      )}

      <p className="auth-page__footer">
        <Link to="/login">Voltar ao login</Link>
      </p>
    </div>
  )
}
