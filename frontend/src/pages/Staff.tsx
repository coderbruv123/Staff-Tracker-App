import { useState, useEffect } from 'react'
import { useAuth } from '../store/AuthContext'
import { useLiveUpdates } from '../hooks/useLiveUpdates'
import { assignmentApi, checkInApi } from '../api/client'
import type { DailyAssignment } from '../api/client'

export default function Self() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<any>(null)
  const [assignments, setAssignments] = useState<DailyAssignment[]>([])
  const [error, setError] = useState<string | null>(null)
  const [checkingIn, setCheckingIn] = useState(false)

  const fetchAssignments = async () => {
    try {
      const res = await assignmentApi.list(new Date().toISOString().slice(0, 10))
      setSummary(res.data)
      setAssignments(res.data.assignments || [])
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load assignments')
    }
  }

  // Live updates from the status hub (staff) — refreshed when staff check in/out.
  useLiveUpdates(() => fetchAssignments())

  useEffect(() => {
    fetchAssignments()
  }, [])

  async function checkIn() {
    if (!myAssignment) return
    setCheckingIn(true)
    setError(null)
    try {
      await checkInApi.checkIn()
      await fetchAssignments()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Check-in failed')
    } finally {
      setCheckingIn(false)
    }
  }

  async function checkOut() {
    if (!myAssignment) return
    setCheckingIn(true)
    setError(null)
    try {
      await checkInApi.checkOut(myAssignment.id)
      await fetchAssignments()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Check-out failed')
    } finally {
      setCheckingIn(false)
    }
  }

  const myAssignment = assignments.find((a: DailyAssignment) => a.staffId === Number(user?.id))

  const total = summary?.total ?? 0
  const reached = summary?.reached ?? 0
  const notReached = summary?.notReached ?? 0

  return (
    <div>
      <div className="topbar">
        <button className="topbar-back">←</button>
        <h1 className="topbar-title">My Day</h1>
        <div className="topbar-actions">
          <div className="search-box">
            <span style={{ color: 'var(--text-muted)', fontSize: '16px' }}>🔍</span>
            <input type="text" placeholder="Search..." />
          </div>
          <div className="avatar-stack">
            <span className="active-avatar">{user?.displayName?.charAt(0) || 'U'}</span>
          </div>
        </div>
      </div>

      <div className="content">
        {error && <p style={{ marginBottom: 16, backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--danger-light)' }}>{error}</p>}

        {/* My Day Card */}
        <div className="self-card">
          <div className="card-title">Welcome, {user?.displayName || 'Staff'}</div>
          <div className="card-subtitle">Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>

        {/* Self Stats */}
        <div className="self-stats">
          <div className="self-stat">
            <div className="num">{total}</div>
            <div className="label">Total Assignments</div>
          </div>
          <div className="self-stat">
            <div className="num inprogress">{myAssignment?.status === 'InProgress' ? 1 : 0}</div>
            <div className="label">On Site</div>
          </div>
          <div className="self-stat">
            <div className="num reached">{reached}</div>
            <div className="label">Reached</div>
          </div>
          <div className="self-stat">
            <div className="num notreached">{notReached}</div>
            <div className="label">Not Reached</div>
          </div>
        </div>

        {/* My Assignments Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Location</th>
                <th>Status</th>
                <th>Checked In</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a: DailyAssignment) => (
                <tr key={a.id}>
                  <td>{a.locationName}</td>
                  <td>
                    <span className={`status-badge ${a.status === 'Reached' ? 'badge-reached' : a.status === 'InProgress' ? 'badge-inprogress' : a.status === 'NotReached' ? 'badge-notreached' : 'badge-pending'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td>
                    <span className="badge-date">
                      {a.checkedInAt ? new Date(a.checkedInAt).toLocaleString() : '—'}
                    </span>
                  </td>
                  <td>
                    {myAssignment?.id === a.id && (
                      <>
                        {myAssignment!.status === 'InProgress' ? (
                          <button className="btn btn-success" onClick={checkOut} disabled={checkingIn}>
                            {checkingIn ? 'Checking out...' : 'Check Out'}
                          </button>
                        ) : (
                          <button className="btn btn-primary" onClick={checkIn} disabled={checkingIn}>
                            {myAssignment!.status === 'Reached' ? 'Check In' : 'Check In Later'}
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {assignments.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-alt)' }}>
                    No assignments for this day.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Geofence Indicator */}
        <div className="geofence">
          <div className="geofence-dot geofence-within"></div>
          <div className="geofence-strap">Location: {myAssignment?.locationName || 'Not on site'}</div>
          <div className="geofence-cord">In geofence region</div>
        </div>
      </div>
    </div>
  )
}
