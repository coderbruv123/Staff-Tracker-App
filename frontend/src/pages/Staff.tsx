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
