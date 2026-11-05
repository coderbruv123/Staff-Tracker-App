import { useState, useEffect } from 'react'
import { useAuth } from '../store/AuthContext'
import { staffApi, assignmentApi } from '../api/client'

export default function History() {
  const { isAdmin } = useAuth()
  const [staff, setStaff] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [selected, setSelected] = useState<number | ''>('')
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      const s = await staffApi.list()
      setStaff(s.data || [])
      if (s.data?.length && !selected) setSelected(s.data[0].id)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load staff')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const loadHistory = async (id: number) => {
    try {
      const res = await assignmentApi.history(id)
      setAssignments(res.data?.assignments || [])
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load history')
    }
  }

  const handleSelect = (id: number) => {
    setSelected(id)
    loadHistory(id)
  }

  // Format date as "Mon, Nov 4, 2026"
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    if (isNaN(d.getTime())) return dateStr || '—'
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div>
      <div className="topbar">
        <button className="topbar-back">←</button>
        <h1 className="topbar-title">History</h1>
        <div className="topbar-actions">
          <div className="search-box">
            <span style={{ color: 'var(--text-muted)', fontSize: '16px' }}>🔍</span>
            <input type="text" placeholder="Search history..." />
          </div>
          <div className="avatar-stack">
            <span className="active-avatar">A</span>
          </div>
        </div>
      </div>

      <div className="content">
        {isAdmin && (
          <>
            <div className="staff-header">
              <div>
                <h1>History</h1>
                <p className="subtitle">Past-day assignment history (admin)</p>
              </div>
            </div>
            <div className="add-assignment" style={{ marginBottom: 16 }}>
              <div className="form-title">Select Staff</div>
              <div className="form-subtitle">Pick a staff member to view their past-day history.</div>
              <select
                style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontFamily: 'inherit' }}
                value={selected}
                onChange={(e) => handleSelect(Number(e.target.value))}
              >
                <option value="">Choose&hellip;</option>
                {staff.map((s: any) => <option key={s.id} value={s.id}>{s.employeeNumber} — {s.displayName}</option>)}
              </select>
            </div>
          </>
        )}

        {error && <p style={{ marginBottom: 16, backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--danger-light)' }}>{error}</p>}

        {isAdmin && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a: any) => (
                  <tr key={a.id}>
                    <td>{formatDate(a.date)}</td>
                    <td>
                      <span className={`status-badge ${
                        a.status === 'Reached' ? 'badge-reached' :
                        a.status === 'InProgress' ? 'badge-inprogress' :
                        a.status === 'NotReached' ? 'badge-notreached' :
                        'badge-pending'
                      }`}>{a.status}</span>
                    </td>
                    <td>{a.location}</td>
                    <td>{a.note || '—'}</td>
                  </tr>
                ))}
                {assignments.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-alt)' }}>
                      No history yet. Create assignments and change status in the dashboard to see history here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
