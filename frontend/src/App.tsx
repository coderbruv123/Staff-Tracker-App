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

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: 'admin' | 'staff' }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="auth-splash">Loading&hellip;</div>
  if (!user) return <Navigate to="/login" replace />
  // Admin routes require admin role
  if (role === 'admin' && !user.isAdmin) return <Navigate to="/self" replace />
  // Staff routes require staff role (non-admin)
  if (role === 'staff' && user.isAdmin) return <Navigate to="/admin/dashboard" replace />
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/staff" element={<ProtectedRoute role="admin"><Staff /></ProtectedRoute>} />
        <Route path="/admin/locations" element={<ProtectedRoute role="admin"><Locations /></ProtectedRoute>} />
        <Route path="/admin/history" element={<ProtectedRoute role="admin"><History /></ProtectedRoute>} />
        <Route path="/self" element={<ProtectedRoute role="staff"><Self /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to={useAuth().isAdmin ? '/admin/dashboard' : '/self'} replace />} />
        <Route path="/assignments" element={<ProtectedRoute role="staff"><Self /></ProtectedRoute>} />
        <Route path="/checkins" element={<ProtectedRoute role="staff"><Self /></ProtectedRoute>} />
      </Route>
    </Routes>
  )
}

export default App
