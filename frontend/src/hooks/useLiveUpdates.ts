import { useEffect, useRef } from 'react'
import {
  HubConnectionBuilder,
  LogLevel,
} from '@microsoft/signalr'
import { useAuth } from '../store/AuthContext'

/**
 * Connects to the staff-tracker status hub and refreshes the given callback
 * whenever `StatusUpdated` is broadcast (e.g. when staff check in/out).
 * Owned by the component that owns the data; it is stopped on unmount.
 *
 * Note: `onUpdate` is tracked via a ref so the subscription only re-runs when
 * the auth/loading flags change (avoids reconnecting on every render).
 */
export function useLiveUpdates(onUpdate: () => void) {
  const { isAdmin, isStaff, loading } = useAuth()
  const onUpdateRef = useRef(onUpdate)
  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  useEffect(() => {
    if (!isStaff || loading || !isAdmin) return

    const connection = new HubConnectionBuilder()
      .withUrl('http://localhost:5289/hubs/status', {
        withCredentials: true,
        timeout: 5000,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build()

    connection.on('StatusUpdated', () => {
      if (!loading) onUpdateRef.current()
    })

    let started = true
    connection
      .start()
      .then(() => {
        if (started) console.info('[LiveUpdates] connected to StatusHub')
      })
      .catch((err) => {
        if (started) console.warn('[LiveUpdates] connect failed:', err)
      })

    return () => {
      started = false
      connection.stop()
    }
  }, [isAdmin, isStaff, loading])
}
