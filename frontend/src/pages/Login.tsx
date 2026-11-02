import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { FormEvent } from 'react'
import { useAuth } from '../store/AuthContext'

export default function Login() {
  const { login, user, isAdmin, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      const target = isAdmin ? '/admin/dashboard' : '/self'
      navigate(target, { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-box">
      <h1>StaffTracker</h1>
      <p className="subtitle">{user ? 'Welcome back' : 'Sign in to track your day'}</p>
      <form className="form" onSubmit={onSubmit}>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={submitting || authLoading}>
          {submitting ? 'Signing in&hellip;' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
