import { useState, useEffect, useRef } from 'react'
import { updateNote } from '../api'

export function useAutoSave(noteId, data, delay = 800) {
  const [status, setStatus] = useState(null) // null | 'saving' | 'saved'
  const timerRef = useRef(null)
  const statusTimerRef = useRef(null)
  const lastSavedRef = useRef(null)
  const isInitialRef = useRef(true)
  const serialized = JSON.stringify(data)

  useEffect(() => {
    if (!noteId || isInitialRef.current) {
      isInitialRef.current = false
      return
    }
    if (serialized === lastSavedRef.current) return

    setStatus('saving')
    if (timerRef.current) clearTimeout(timerRef.current)
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current)

    timerRef.current = setTimeout(async () => {
      try {
        await updateNote(noteId, data)
        lastSavedRef.current = serialized
        setStatus('saved')
        statusTimerRef.current = setTimeout(() => setStatus(null), 2000)
      } catch {
        setStatus(null)
      }
    }, delay)

    return () => {
      clearTimeout(timerRef.current)
    }
  }, [data, delay, noteId, serialized])

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current)
      clearTimeout(statusTimerRef.current)
    }
  }, [])

  return status
}
