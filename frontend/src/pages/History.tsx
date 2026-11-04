import { useState, useEffect } from 'react'
import { staffApi, assignmentApi } from '../api/client'

export default function History() {
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
      <div className="page-head">
        <div>
          <h1>History</h1>
          <p className="subtitle">Past-day assignment history (admin).</p>
        </div>
      </div>

      <div className="card">
        <h2 style={{ margin: 0 }}>Select staff</h2>
        <p className="subtitle" style={{ margin: '8px 0 12px' }}>Pick a staff member to view their past-day history.</p>
        <div className="form-grid">
          <label>Staff</label>
          <select value={selected} onChange={(e) => handleSelect(Number(e.target.value))}>
            <option value="">Choose&hellip;</option>
            {staff.map((s: any) => <option key={s.id} value={s.id}>{s.employeeNumber} &mdash; {s.displayName}</option>)}
          </select>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="card">
        <h2 style={{ margin: 0 }}>History <span className="subtitle" style={{ fontSize: 13 }}>{selected ? `for staff #${selected}` : ''}</span></h2>
        {assignments.length === 0 ? (
          <p className="subtitle">No history yet. Create assignments and change status in the dashboard to see history here.</p>
        ) : (
          <div className="table-wrap">
            <table className="history-table">
              <thead>
                <tr><th>Date</th><th>Status</th><th>Location</th><th>Note</th></tr>
              </thead>
              <tbody>
                {assignments.map((a: any) => (
                  <tr key={a.id}>
                    <td>{formatDate(a.date)}</td>
                    <td>
                      <span className={`pill ${a.status === 'Reached' ? 'pill-reached' : a.status === 'InProgress' ? 'pill-inprogress' : a.status === 'NotReached' ? 'pill-notreached' : 'pill-pending'}`}>{a.status}</span>
                    </td>
                    <td>{a.location}</td>
                    <td>{a.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
