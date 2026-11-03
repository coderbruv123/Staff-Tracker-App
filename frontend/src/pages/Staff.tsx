import { useState, useEffect } from 'react'
import { useAuth } from '../store/AuthContext'
import { staffApi } from '../api/client'

export default function Staff() {
  const { isAdmin } = useAuth()
  const [staff, setStaff] = useState<any[]>([])
  const [pending, setPending] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const [s, p] = await Promise.all([staffApi.list(), staffApi.pending()])
      setStaff(s.data || [])
      setPending(p.data || [])
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load staff')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const approve = async (id: number) => {
    try {
      await staffApi.approve(id)
      load()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to approve')
    }
  }

  const [form, setForm] = useState({ employeeNumber: '', displayName: '', phone: '', department: '' })
  const [formMessage, setFormMessage] = useState<string | null>(null)

  const onAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormMessage(null)
    try {
      await staffApi.add(form)
      setForm({ employeeNumber: '', displayName: '', phone: '', department: '' })
      setFormMessage(`Added "${form.displayName}". Password: Staff123!`)
      load()
    } catch (err: any) {
      setFormMessage(err.response?.data?.error || 'Failed to add staff')
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Staff</h1>
          <p className="subtitle">{isAdmin ? 'Manage the people on your team' : 'Staff view'}</p>
        </div>
        {isAdmin && <span className="badge badge-staff">{pending.length} pending approval</span>}
      </div>

      {error && <p className="error">{error}</p>}

      {isAdmin && pending.length > 0 && (
        <div className="card">
          <h2 style={{ margin: 0 }}>Pending registration</h2>
          <p className="subtitle" style={{ margin: '8px 0 12px' }}>New staff need admin approval before their account is active.</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Employee</th><th>Action</th></tr>
              </thead>
              <tbody>
                {pending.map((s) => (
                  <tr key={s.id}>
                    <td>{s.displayName} <span className="num" style={{ fontSize: 12, color: 'var(--text-alt)' }}>{s.employeeNumber}</span></td>
                    <td>{s.email}</td>
                    <td>{s.registrationStatus}</td>
                    <td>
                      <button className="btn btn-success btn-sm" onClick={() => approve(s.id)}>Approve</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="card" style={{ marginBottom: 18 }}>
          <h2 style={{ margin: 0 }}>Add staff</h2>
          <p className="subtitle" style={{ margin: '8px 0 12px' }}>Create a new staff account. Password is auto-generated.</p>
          <form className="form" onSubmit={onAddStaff}>
            <div className="form-grid">
              <label>Employee number</label>
              <input type="text" value={form.employeeNumber} onChange={(e) => setForm({ ...form, employeeNumber: e.target.value })} placeholder="STAFF-100" required />
              <label>Display name</label>
              <input type="text" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Jane Doe" required />
              <label>Phone</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0712345678" />
              <label>Department</label>
              <input type="text" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Engineering" />
            </div>
            {formMessage && <p className="subtitle" style={{ color: formMessage.includes('Added') ? 'var(--success)' : 'var(--danger)' }}>{formMessage}</p>}
            <button type="submit" className="btn btn-primary">Add staff</button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="page-head">
          <h2 style={{ margin: 0 }}>All staff</h2>
        </div>
        {loading ? <p className="subtitle">Loading&hellip;</p> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Employee</th><th>Phone</th><th>Status</th><th>Registered</th></tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.displayName}</strong> <span className="num" style={{ fontSize: 12, color: 'var(--text-alt)' }}>{s.employeeNumber}</span></td>
                    <td>{s.phone}</td>
                    <td><span className={`pill ${s.status === 'Active' ? 'pill-reached' : 'pill-pending'}`}>{s.status}</span></td>
                    <td>{s.registrationStatus || 'Pending'}</td>
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
