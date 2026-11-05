import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import { apiAuth } from '../api/client'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await apiAuth.login(email, password)
      // Check current user role
      const meRes = await apiAuth.me()
      const user = meRes.data
      login(email, password)
      // Redirect based on role
      if (user.isAdmin) {
        navigate('/admin/dashboard')
      } else {
        navigate('/self')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand">
          <div className="brand-icon">S</div>
        </div>
        <h1>StaffTracker</h1>
        <p className="subtitle">Sign in to manage your assignments</p>
        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="error">{error}</div>}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Sign In
          </button>
        </form>
        <div className="footer">
          Demo credentials:<br />
          <code>admin@stafftracker.local</code> / <code>Admin123!</code><br />
          <code>staff1@example.com</code> / <code>Staff123!</code>
        </div>
      </div>
    </div>
  )
}
