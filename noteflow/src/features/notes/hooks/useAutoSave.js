import { useState, useEffect, useRef } from 'react'
import { updateNote } from '../api'

export function useAutoSave(noteId, data, delay = 800) {
  const [status, setStatus] = useState(null) // null | 'saving' | 'saved'
  const timerRef = useRef(null)
  const lastSavedRef = useRef(null)
  const isInitialRef = useRef(true)

  useEffect(() => {
    if (!noteId || isInitialRef.current) {
      isInitialRef.current = false
      return
    }
    const serialized = JSON.stringify(data)
    if (serialized === lastSavedRef.current) return

    setStatus('saving')
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      try {
        await updateNote(noteId, data)
        lastSavedRef.current = serialized
        setStatus('saved')
        setTimeout(() => setStatus(null), 2000)
      } catch {
        setStatus(null)
      }
    }, delay)

    return () => clearTimeout(timerRef.current)
  }, [noteId, JSON.stringify(data), delay])

  return status
}
