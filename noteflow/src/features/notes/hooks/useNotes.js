import { useState, useEffect, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/offline/db'
import { fetchNotes, fetchSharedNotes } from '../api'
import { useAuth } from '@/hooks/useAuth'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export function useNotes() {
  const { user } = useAuth()
  const online = useOnlineStatus()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!user || !online) return
    setLoading(true)
    try {
      await fetchNotes(user.id)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [user, online])

  useEffect(() => {
    refresh().then(() => setLoading(false))
  }, [refresh])

  const notes = useLiveQuery(
    () => user ? db.notes.where('user_id').equals(user.id).toArray() : [],
    [user?.id],
    []
  )

  return { notes: notes ?? [], loading, error, refresh }
}

export function useNote(noteId) {
  const note = useLiveQuery(
    () => noteId ? db.notes.get(noteId) : null,
    [noteId]
  )
  return note
}
