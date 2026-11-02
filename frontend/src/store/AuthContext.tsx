import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '../api/client'
import { apiAuth } from '../api/client'

interface AuthState {
  user: User | null
  isAdmin: boolean | null
  isStaff: boolean | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

function formatUser(u: any): User {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    isAdmin: Boolean(u.isAdmin),
    isStaff: Boolean(u.isStaff),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    user: User | null
    isAdmin: boolean | null
    isStaff: boolean | null
    loading: boolean
  }>({
    user: null,
    isAdmin: null,
    isStaff: null,
    loading: true,
  })

  const checkAuth = async () => {
    try {
      const res = await apiAuth.me()
      const user = formatUser(res.data)
      setState({ user, isAdmin: user.isAdmin, isStaff: user.isStaff, loading: false })
    } catch {
      setState({ user: null, isAdmin: null, isStaff: null, loading: false })
    }
  }

  const login = async (email: string, password: string) => {
    const res = await apiAuth.login(email, password)
    const user = formatUser(res.data.user)
    setState({ user, isAdmin: user.isAdmin, isStaff: user.isStaff, loading: false })
  }

  const logout = async () => {
    await apiAuth.logout()
    setState({ user: null, isAdmin: null, isStaff: null, loading: false })
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <AuthContext.Provider
      value={{ user: state.user, isAdmin: state.isAdmin, isStaff: state.isStaff, loading: state.loading, login, logout, checkAuth }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
