import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import '../styles.css'

export default function Navbar() {
  const { user, logout, isAdmin, isStaff } = useAuth()

  async function handleLogout() {
    await logout()
  }

  if (!user) return null

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="brand">
          <span className="brand-mark" /> StaffTracker
        </Link>
        <div className="badge badge-admin" hidden={!isAdmin}>Admin</div>
        <div className="badge badge-staff" hidden={!isStaff}>Staff</div>
      </div>
      <nav className="navbar-nav">
        {isAdmin && (
          <>
            <NavLink to="/admin/dashboard" className="nav-link" end>Dashboard</NavLink>
            <NavLink to="/admin/staff" className="nav-link">Staff</NavLink>
            <NavLink to="/admin/locations" className="nav-link">Locations</NavLink>
            <NavLink to="/admin/history" className="nav-link">History</NavLink>
          </>
        )}
        {isStaff && (
          <>
            <NavLink to="/assignments" className="nav-link">My Assignments</NavLink>
            <NavLink to="/checkins" className="nav-link">Check-Ins</NavLink>
          </>
        )}
      </nav>
      <div className="navbar-user">
        <span className="user-name">{user.displayName}</span>
        <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
      </div>
    </header>
  )
}
