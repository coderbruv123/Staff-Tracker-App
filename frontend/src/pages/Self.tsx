import { useState, useEffect } from 'react'
import { useAuth } from '../store/AuthContext'
import { assignmentApi, checkInApi } from '../api/client'

export default function Self() {
  const { isStaff } = useAuth()
  const [assignment, setAssignment] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const res = await assignmentApi.today()
      const assign = res.data?.assignments?.find((a: any) => a.staffId === null || a.staffId === null) || res.data?.assignments?.[0]
      setAssignment(assign)
      setLogs([])
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load your assignment')
    }
  }

  useEffect(() => {
    if (isStaff) load()
  }, [isStaff])

  // Re-fetch latest assignment state on the staff's own mount re-run
  useEffect(() => {
    if (isStaff) load()
  }, [isStaff])

  const checkIn = async (lat?: string, lng?: string) => {
    setSaving(true)
    setError(null)
    try {
      await checkInApi.checkIn(lat, lng)
      load()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Check-in failed')
    } finally {
      setSaving(false)
    }
  }

  const checkOut = async () => {
    if (!assignment?.id) return
    setSaving(true)
    setError(null)
    try {
      await checkInApi.checkOut(assignment.id)
      load()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Check-out failed')
    } finally {
      setSaving(false)
    }
  }

  if (!assignment) {
    return (
      <div className="card">
        <h1 style={{ margin: 0 }}>My day</h1>
        <p className="subtitle">No assignment found for today. Please check with your admin or visit the staff page.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>My day <span className="subtitle">{assignment.staffDisplayName} &middot; {assignment.locationName}</span></h1>
        </div>
      </div>

      <div className="card">
        <div className="card-grid">
          <div className="stat"><div className="num" style={{ color: 'var(--success)' }}>{assignment.status === 'Reached' ? 'Reached' : 'Pending'}</div><span>Status</span></div>
          <div className="stat"><div className="num" style={{ color: 'var(--text-alt)' }}>{assignment.checkedInAt ? new Date(assignment.checkedInAt).toLocaleString() : 'Not yet'}</div><span>Checked in</span></div>
        </div>

        <div className="card" style={{ marginTop: 18 }}>
          <h2 style={{ margin: 0 }}>Check in / out</h2>
          <p className="subtitle" style={{ margin: '8px 0 12px' }}>
            {assignment.status === 'Pending' && 'Tap the button to mark your arrival.'}<br />
            {assignment.status === 'InProgress' && 'You are on site. Tap to check out when you leave.'}
            {assignment.status === 'Reached' && 'You have reached the location. You can still check out.'}
            {assignment.status === 'NotReached' && 'You can check in again from Pending to In Progress.'}
          </p>

          {assignment.status === 'NotReached' && (
            <button className="btn btn-primary" onClick={() => checkIn()} disabled={saving}>
              {saving ? 'Checking in...' : 'I have arrived'}
            </button>
          )}
          {assignment.status === 'InProgress' && (
            <button className="btn btn-success" onClick={() => checkOut()} disabled={saving}>
              {saving ? 'Checking out...' : 'Check out (leave)'}
            </button>
          )}
          {assignment.status === 'Reached' && (
            <button className="btn btn-success" onClick={() => checkOut()} disabled={saving}>
              {saving ? 'Checking out...' : 'Check out (leave)'}
            </button>
          )}
          {assignment.status === 'Pending' && (
            <button className="btn btn-primary" onClick={() => checkIn()} disabled={saving}>
              {saving ? 'Checking in...' : 'Mark arrived'}
            </button>
          )}
          {error && <p className="error" style={{ marginTop: 8 }}>{error}</p>}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ margin: 0 }}>Activity log</h2>
        <p className="subtitle" style={{ margin: '8px 0 12px' }}>Recent check-ins and check-outs.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Time</th><th>Event</th><th>Lat</th><th>Lng</th></tr>
            </thead>
            <tbody>
              {logs.slice().reverse().map((l: any) => (
                <tr key={l.id}>
                  <td>{new Date(l.timestamp).toLocaleString()}</td>
                  <td>{l.eventType}</td>
                  <td className="num">{l.lat ?? ''}</td>
                  <td className="num">{l.lng ?? ''}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-alt)' }}>No activity yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
