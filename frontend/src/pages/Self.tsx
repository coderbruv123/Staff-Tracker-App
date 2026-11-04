import { useState, useEffect } from 'react'
import { useAuth } from '../store/AuthContext'
import { assignmentApi, checkInApi, apiAuth } from '../api/client'

export default function Self() {
  const { isStaff } = useAuth()
  const [assignment, setAssignment] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [myPosition, setMyPosition] = useState<{ lat?: string; lng?: string } | null>(null)
  const [geofenceStatus, setGeofenceStatus] = useState<'unknown' | 'within' | 'outside'>('unknown')
  const [geofenceDistance, setGeofenceDistance] = useState<number | null>(null)

  const haversineMeters = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371000
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180 * Math.cos(lat1 * Math.PI / 180)
    return Math.sqrt(dLat * dLat + dLng * dLng) * R
  }

  const load = async () => {
    try {
      const meRes = await apiAuth.me()
      const currentStaffId = meRes.data?.id
      const res = await assignmentApi.today()
      const assignments = res.data?.assignments || []
      const assign = assignments.find((a: any) => a.staffId === currentStaffId) ?? assignments[0]
      setAssignment(assign)
      setLogs([])
      const logsRes = await checkInApi.getLogs()
      setLogs((logsRes.data?.assignments ?? []).flatMap((a: any) => a.logs ?? []))
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

  const checkInWithLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError('Location services are not supported in this browser.')
      return
    }
    setLocating(true)
    setLocationError(null)
    setMyPosition(null)
    setGeofenceStatus('unknown')
    setGeofenceDistance(null)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
        })
      })
      const currentLat = pos.coords.latitude
      const currentLng = pos.coords.longitude
      setMyPosition({ lat: currentLat.toString(), lng: currentLng.toString() })
      if (assignment.locationLatitude != null && assignment.locationLongitude != null) {
        const distance = haversineMeters(currentLat, currentLng, assignment.locationLatitude, assignment.locationLongitude)
        setGeofenceDistance(Math.round(distance))
        setGeofenceStatus(distance <= 500 ? 'within' : 'outside')
      }
      await checkInApi.checkIn(currentLat.toString(), currentLng.toString())
      load()
    } catch (err: any) {
      setLocationError(err.message || 'Could not get your location.')
    } finally {
      setLocating(false)
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
          <div className="stat">
            <div className={`num ${assignment.status === 'Reached' ? 'text-success' : assignment.status === 'InProgress' ? 'text-info' : assignment.status === 'NotReached' ? 'text-danger' : ''}`}>
              {assignment.status}
            </div>
            <span>Status</span>
          </div>
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
          <button
            className="btn btn-ghost"
            onClick={checkInWithLocation}
            disabled={saving || locating}
            title="Auto-fill your coordinates using your device's location"
          >
            {locating ? 'Locating...' : 'Use my position'}
          </button>
          {myPosition && (
            <div className="subtitle" style={{ marginTop: 6 }}>
              Your position: Lat {Number(myPosition.lat).toFixed(5)}, Lng {Number(myPosition.lng).toFixed(5)}
            </div>
          )}
          {assignment.locationLatitude != null && (
            <div className="subtitle" style={{ marginTop: 6 }}>
              {assignment.locationName}'s location: Lat {Number(assignment.locationLatitude).toFixed(5)}, Lng {Number(assignment.locationLongitude).toFixed(5)}
            </div>
          )}
          {geofenceStatus !== 'unknown' && geofenceDistance !== null && (
            <div className={`geofence ${geofenceStatus === 'within' ? 'geofence-within' : 'geofence-outside'}`}>
              <span className="geofence-dot" />
              <span className="geofence-strap">
                {geofenceStatus === 'within' ? 'You are within the location area' : 'You are outside the location area'}
              </span>
              <span className="geofence-cord">~{geofenceDistance} m from location</span>
            </div>
          )}
          {locationError && <p className="error" style={{ marginTop: 8 }}>{locationError}</p>}
          {error && <p className="error" style={{ marginTop: 8 }}>{error}</p>}
          <p className="subtitle" style={{ marginTop: 6 }}>
            {assignment.checkedInAt
              ? (() => {
                  const last = logs.slice().reverse().find((l: any) => l.lat != null || l.lng != null)
                  if (!last?.lat && last?.lng == null) return 'Last recorded position: none'
                  return `Last recorded position: Lat ${Number(last.lat).toFixed(5)}, Lng ${Number(last.lng).toFixed(5)}`
                })()
              : ''}
          </p>
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
                  <td>{(() => { const d = new Date(l.timestamp); return isNaN(d.getTime()) ? '—' : d.toLocaleString(); })()}</td>
                  <td>{l.eventType ?? ''}</td>
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
