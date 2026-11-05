import { useState, useEffect } from 'react'
import { useAuth } from '../store/AuthContext'
import { locationApi } from '../api/client'

export default function Locations() {
  const { isAdmin } = useAuth()
  const [locations, setLocations] = useState<any[]>([])
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      const res = await locationApi.list()
      setLocations(res.data || [])
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load locations')
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      await locationApi.add({ name, address, notes })
      setName('')
      setAddress('')
      setNotes('')
      load()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create location')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="topbar">
        <button className="topbar-back">←</button>
        <h1 className="topbar-title">Locations</h1>
        <div className="topbar-actions">
          <div className="search-box">
            <span style={{ color: 'var(--text-muted)', fontSize: '16px' }}>🔍</span>
            <input type="text" placeholder="Search locations..." />
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
                <h1>Locations</h1>
                <p className="subtitle">Where your team works each day</p>
              </div>
              <div className="stat-card">
                <div className="label">Active Locations</div>
                <div className="num">{locations.length}</div>
                <div className="subtitle">Today</div>
              </div>
            </div>
            <div className="add-assignment" style={{ marginBottom: 16 }}>
              <div className="form-title">Add Location</div>
              <div className="form-subtitle">A new place staff will be assigned to today.</div>
              <form onSubmit={onSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
                  <label>Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Location 1" required />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
                  <label>Address</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="100 Main St" />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
                  <label>Notes</label>
                  <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
                </div>
                <button type="submit" className="btn-primary" disabled={saving || !name.trim()} style={{ alignSelf: 'flex-end' }}>
                  {saving ? 'Saving...' : 'Add Location'}
                </button>
              </form>
              {error && <p style={{ marginTop: 8, backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--danger-light)' }}>{error}</p>}
            </div>
          </>
        )}

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Coordinates</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((l) => (
                <tr key={l.id}>
                  <td><strong>{l.name}</strong></td>
                  <td>{l.address}</td>
                  <td className="badge-staff-number">
                    {l.latitude != null && l.longitude != null
                      ? `Lat ${Number(l.latitude).toFixed(5)}, Lng ${Number(l.longitude).toFixed(5)}`
                      : '—'}
                  </td>
                  <td>{l.notes}</td>
                </tr>
              ))}
              {locations.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-alt)' }}>
                    No locations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
