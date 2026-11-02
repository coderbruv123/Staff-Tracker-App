import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './store/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Staff from './pages/Staff'
import Locations from './pages/Locations'
import History from './pages/History'
import Self from './pages/Self'

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="auth-splash">Checking session&hellip;</div>
  if (user) return <Navigate to={user.isAdmin ? '/admin/dashboard' : '/self'} replace />
  return <>{children}</>
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="auth-splash">Loading&hellip;</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/staff" element={<ProtectedRoute><Staff /></ProtectedRoute>} />
        <Route path="/admin/locations" element={<ProtectedRoute><Locations /></ProtectedRoute>} />
        <Route path="/admin/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/self" element={<ProtectedRoute><Self /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to={useAuth().isAdmin ? '/admin/dashboard' : '/self'} replace />} />
      </Route>
    </Routes>
  )
}

export default App
