import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import { useState } from 'react'
import '../styles.css'

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  async function handleLogout() {
    await logout()
  }

  const navItems = isAdmin ? (
    <>
      <NavLink to="/admin/dashboard" className="nav-item" end>
        <span className="icon dashboard">📊</span>
        Dashboard
      </NavLink>
      <NavLink to="/admin/staff" className="nav-item">
        <span className="icon staff">👥</span>
        Staff
        <span className="badge badge-pending">3</span>
      </NavLink>
      <NavLink to="/admin/locations" className="nav-item">
        <span className="icon locations">📍</span>
        Locations
      </NavLink>
      <NavLink to="/admin/history" className="nav-item">
        <span className="icon history">📋</span>
        History
      </NavLink>
    </>
  ) : (
    <>
      <NavLink to="/self" className="nav-item">
        <span className="icon self">👤</span>
        My Day
      </NavLink>
    </>
  )

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="mobile-overlay" onClick={() => setIsOpen(false)}></div>}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="brand">
            <div className="brand-icon">S</div>
            <div className="brand-name">StaffTracker</div>
          </Link>
          <div className={`brand-badge ${isAdmin ? 'admin' : 'staff'}`}>
            {isAdmin ? 'Admin' : 'Staff'}
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Main</div>
            {navItems}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {user?.displayName?.charAt(0) || 'U'}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.displayName || 'User'}</div>
              <div className="user-role">{isAdmin ? 'Administrator' : 'Staff'}</div>
            </div>
            <button
              className="logout-btn"
              onClick={handleLogout}
              style={{ display: 'none' }}
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile close button */}
      {isOpen && (
        <button
          className="mobile-close"
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: '12px',
            right: '12px',
            zIndex: 101,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '18px',
            color: 'var(--text-muted)'
          }}
        >
          ✕
        </button>
      )}
    </>
  )
}
