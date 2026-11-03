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
      <div className="page-head">
        <div>
          <h1>Locations</h1>
          <p className="subtitle">{isAdmin ? 'Where your team works each day' : 'Your location for the day'}</p>
        </div>
        {isAdmin && (
          <div className="card card-grid">
            <div className="stat"><div className="num">{locations.length}</div><span>Active locations</span></div>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="card" style={{ marginBottom: 18 }}>
          <h2 style={{ margin: 0 }}>Add location</h2>
          <p className="subtitle" style={{ margin: '8px 0 12px' }}>A new place staff will be assigned to today.</p>
          <form className="form" onSubmit={onSubmit}>
            <div className="form-grid">
              <label>Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Location 1" required />
              <label>Address</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="100 Main St" />
              <label>Notes</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={saving || !name.trim()}>
              {saving ? 'Saving...' : 'Add location'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h2 style={{ margin: 0 }}>Locations</h2>
        {locations.length === 0 ? (
          <p className="subtitle">No locations yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Address</th><th>Coordinates</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {locations.map((l) => (
                  <tr key={l.id}>
                    <td><strong>{l.name}</strong></td>
                    <td>{l.address}</td>
                    <td className="coord">
                      {l.latitude != null && l.longitude != null
                        ? `Lat ${Number(l.latitude).toFixed(5)}, Lng ${Number(l.longitude).toFixed(5)}`
                        : '—'}
                    </td>
                    <td>{l.notes}</td>
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
