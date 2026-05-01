import { useState, useEffect } from 'react'
import { fetchSharedNotes } from '@/features/notes/api'
import { NoteCard } from '@/features/notes/components/NoteCard'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useAuth } from '@/hooks/useAuth'

export default function SharedNotesPage() {
  const { user } = useAuth()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchSharedNotes(user.id).then(n => { setNotes(n); setLoading(false) })
    }
  }, [user])

  if (loading) return <div className="p-4" style={{ color: 'var(--text-muted)' }}>Loading...</div>

  return (
    <div className="p-4">
      <h1 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Shared with me</h1>
      {notes.length === 0 ? (
        <EmptyState title="No shared notes" description="Notes shared with you will appear here" />
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
          {notes.map(note => (
            <div key={note.id} className="mb-4 break-inside-avoid">
              <NoteCard note={note} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
