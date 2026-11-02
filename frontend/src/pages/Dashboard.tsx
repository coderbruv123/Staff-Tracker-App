import { useState, useEffect } from 'react'
import { useAuth } from '../store/AuthContext'
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

  const statusClass = (s: string) => {
    if (s === 'Reached') return 'pill-reached'
    if (s === 'InProgress') return 'pill-inprogress'
    if (s === 'NotReached') return 'pill-notreached'
    return 'pill-pending'
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="subtitle">Live status across the site &mdash; {summary?.date || ''}</p>
        </div>
        <div className="card card-grid">
          <div className="stat"><div className="num">{summary?.total ?? 0}</div><span>Total</span></div>
          <div className="stat"><div className="num" style={{ color: 'var(--success)' }}>{summary?.reached ?? 0}</div><span className="pill pill-reached">Reached</span></div>
          <div className="stat"><div className="num" style={{ color: 'var(--info)' }}>{summary?.inProgress ?? 0}</div><span className="pill pill-inprogress">In Progress</span></div>
          <div className="stat"><div className="num" style={{ color: 'var(--text-alt)' }}>{summary?.pending ?? 0}</div><span className="pill pill-pending">Pending</span></div>
          <div className="stat"><div className="num" style={{ color: 'var(--danger)' }}>{summary?.notReached ?? 0}</div><span className="pill pill-notreached">Not Reached</span></div>
        </div>
      </div>

      <div className="card">
        <div className="page-head">
          <h2 style={{ margin: 0 }}>Today&apos;s assignments</h2>
          <div className="form-grid" style={{ gap: 10 }}>
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <button className="btn btn-primary" onClick={() => { fetchAssignments(); fetchOptions() }}>Refresh</button>
          </div>
        </div>
        {error && <p className="error" style={{ marginTop: 8 }}>{error}</p>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Staff</th><th>Location</th><th>Status</th><th>Last Updated</th><th>Action</th></tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.staffDisplayName}</strong> <span className="num" style={{ fontSize: 12, color: 'var(--text-alt)' }}>{a.staffEmployeeNumber}</span></td>
                  <td>{a.locationName}</td>
                  <td><span className={`pill ${statusClass(a.status)}`}>{a.status}</span></td>
                  <td>{a.checkedInAt ? new Date(a.checkedInAt).toLocaleString() : ''}</td>
                  <td>
                    {(isAdmin || a.staffId === 0) && (
                      <select
                        className="pill"
                        style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)' }}
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
              {assignments.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-alt)' }}>No assignments for this day.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ marginTop: 18 }}>
          <h2 style={{ margin: 0 }}>Add assignment</h2>
          <p className="subtitle" style={{ margin: '8px 0 12px' }}>Assign a staff member to a location for a day.</p>
          <form className="form" onSubmit={createAssignment}>
            <div className="form-grid">
              <label>Staff</label>
              <select value={formStaff} onChange={(e) => setFormStaff(Number(e.target.value))}>
                <option value="">Choose staff&hellip;</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.employeeNumber} &mdash; {s.displayName}</option>)}
              </select>
              <label>Location</label>
              <select value={formLocation} onChange={(e) => setFormLocation(Number(e.target.value))}>
                <option value="">Choose location&hellip;</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name} &mdash; {l.address}</option>)}
              </select>
              <label>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={!formStaff || !formLocation || saving}>
              {saving ? 'Assigning...' : 'Add assignment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
