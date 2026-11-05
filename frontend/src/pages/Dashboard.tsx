import { useState, useEffect } from 'react'
import { useAuth } from '../store/AuthContext'
import { useLiveUpdates } from '../hooks/useLiveUpdates'
import { assignmentApi, locationApi, staffApi } from '../api/client'
import type { DailyAssignment, Location, Staff } from '../api/client'

export default function Dashboard() {
  const { isAdmin } = useAuth()
  const [summary, setSummary] = useState<any>(null)
  const [assignments, setAssignments] = useState<DailyAssignment[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [formStaff, setFormStaff] = useState<number | ''>('')
  const [formLocation, setFormLocation] = useState<number | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchAssignments = async () => {
    try {
      const res = await assignmentApi.list(date)
      setSummary(res.data)
      setAssignments(res.data.assignments || [])
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load assignments')
    }
  }

  // Live updates from the status hub (admins) — refreshed when staff change status.
  useLiveUpdates(() => fetchAssignments())

  const fetchOptions = async () => {
    try {
      const s = await staffApi.list()
      setStaff(s.data || [])
      const l = await locationApi.list()
      setLocations(l.data || [])
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load options')
    }
  }

  useEffect(() => {
    fetchAssignments()
    fetchOptions()
  }, [date])

  async function updateStatus(id: number, status: string) {
    try {
      await assignmentApi.updateStatus(id, status)
      fetchAssignments()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update status')
    }
  }

  async function createAssignment(e: React.FormEvent) {
    e.preventDefault()
    if (!formStaff || !formLocation) return
    setSaving(true)
    setError(null)
    try {
      await assignmentApi.create({ staffId: formStaff, locationId: formLocation })
      setSummary(null)
      setAssignments([])
      await fetchAssignments()
      setFormStaff('')
      setFormLocation('')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create assignment')
    } finally {
      setSaving(false)
    }
  }

  // Visual progress bar widths
  const total = summary?.total ?? 0
  const reachedPct = total > 0 ? (summary?.reached ?? 0) / total : 0
  const inProgressPct = total > 0 ? (summary?.inProgress ?? 0) / total : 0
  const pendingPct = total > 0 ? (summary?.pending ?? 0) / total : 0
  const notReachedPct = total > 0 ? (summary?.notReached ?? 0) / total : 0

  return (
    <div>
      <div className="topbar">
        <button className="topbar-back">←</button>
        <h1 className="topbar-title">Dashboard</h1>
        <div className="topbar-actions">
          <div className="search-box">
            <span style={{ color: 'var(--text-muted)', fontSize: '16px' }}>🔍</span>
            <input type="text" placeholder="Search assignments, staff, locations..." />
          </div>
          <div className="avatar-stack">
            <span className="active-avatar">A</span>
          </div>
        </div>
      </div>

      <div className="content">
        {error && <p style={{ marginBottom: 16, backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--danger-light)' }}>{error}</p>}

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="label">Total Assignments</div>
            <div className="num">{summary?.total ?? 0}</div>
            <div className="subtitle">For today, Nov 5</div>
          </div>
          <div className="stat-card">
            <div className="label">Reached</div>
            <div className="num reached">{summary?.reached ?? 0}</div>
            <div className="subtitle">Status: Reached</div>
          </div>
          <div className="stat-card">
            <div className="label">In Progress</div>
            <div className="num inprogress">{summary?.inProgress ?? 0}</div>
            <div className="subtitle">Currently on site</div>
          </div>
          <div className="stat-card">
            <div className="label">Pending</div>
            <div className="num pending">{summary?.pending ?? 0}</div>
            <div className="subtitle">Not yet checked in</div>
          </div>
          <div className="stat-card">
            <div className="label">Not Reached</div>
            <div className="num notreached">{summary?.notReached ?? 0}</div>
            <div className="subtitle">Outside geofence</div>
          </div>
        </div>

        {/* Status Pills */}
        <div className="status-pills">
          <div className="status-pill">
            <div className="label">Reached</div>
            <div className="bar"><div className="fill reached" style={{ width: reachedPct * 100 + '%' }}></div></div>
            <div className="count">{summary?.reached ?? 0}</div>
          </div>
          <div className="status-pill">
            <div className="label">In Progress</div>
            <div className="bar"><div className="fill inprogress" style={{ width: inProgressPct * 100 + '%' }}></div></div>
            <div className="count">{summary?.inProgress ?? 0}</div>
          </div>
          <div className="status-pill">
            <div className="label">Pending</div>
            <div className="bar"><div className="fill pending" style={{ width: pendingPct * 100 + '%' }}></div></div>
            <div className="count">{summary?.pending ?? 0}</div>
          </div>
          <div className="status-pill">
            <div className="label">Not Reached</div>
            <div className="bar"><div className="fill Notreached" style={{ width: notReachedPct * 100 + '%' }}></div></div>
            <div className="count">{summary?.notReached ?? 0}</div>
          </div>
        </div>

        {/* Today's Assignments Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Staff</th>
                <th>Location</th>
                <th>Status</th>
                <th>Checked In</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.staffDisplayName}</strong><br></br>
                    <span className="badge-staff-number">{a.staffEmployeeNumber}</span>
                  </td>
                  <td>{a.locationName}</td>
                  <td>
                    <span className={`status-badge ${
                      a.status === 'Reached' ? 'badge-reached' :
                      a.status === 'InProgress' ? 'badge-inprogress' :
                      a.status === 'NotReached' ? 'badge-notreached' :
                      'badge-pending'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td>
                    <span className="badge-date">
                      {a.checkedInAt ? new Date(a.checkedInAt).toLocaleString() : '—'}
                    </span>
                  </td>
                  <td>
                    {(isAdmin || a.staffId === 0) && (
                      <select
                        className="action-select"
                        value={a.status}
                        onChange={(e) => updateStatus(a.id, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="InProgress">In Progress</option>
                        <option value="Reached">Reached</option>
                        <option value="NotReached">Not Reached</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
              {assignments.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-alt)' }}>
                    No assignments for this day.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add Assignment Form */}
        <form className="add-assignment" onSubmit={createAssignment}>
          <div className="form-title">Add Assignment</div>
          <div className="form-subtitle">Assign a staff member to a location for a day.</div>
          <div className="form-grid">
            <div className="form-group">
              <label>Staff</label>
              <select value={formStaff} onChange={(e) => setFormStaff(Number(e.target.value))}>
                <option value="">Choose staff...</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.employeeNumber} — {s.displayName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Location</label>
              <select value={formLocation} onChange={(e) => setFormLocation(Number(e.target.value))}>
                <option value="">Choose location...</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name} — {l.address}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={!formStaff || !formLocation || saving}>
            {saving ? 'Assigning...' : 'Add Assignment'}
          </button>
        </form>
      </div>
    </div>
  )
}
