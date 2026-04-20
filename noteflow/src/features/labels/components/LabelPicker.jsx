import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check } from 'lucide-react'
import { db } from '@/services/offline/db'
import { addLabelToNote, removeLabelFromNote, fetchNoteLabels } from '../api'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

export function LabelPicker({ noteId }) {
  const { user } = useAuth()
  const [selected, setSelected] = useState([])

  const labels = useLiveQuery(
    () => user ? db.labels.where('user_id').equals(user.id).sortBy('name') : [],
    [user?.id],
    []
  )

  useEffect(() => {
    if (noteId) fetchNoteLabels(noteId).then(setSelected)
  }, [noteId])

  const toggle = async (labelId) => {
    if (selected.includes(labelId)) {
      await removeLabelFromNote(noteId, labelId)
      setSelected(s => s.filter(id => id !== labelId))
    } else {
      await addLabelToNote(noteId, labelId)
      setSelected(s => [...s, labelId])
    }
  }

  if (!labels?.length) return <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No labels. Create some in sidebar.</p>

  return (
    <div className="space-y-1">
      {labels.map(label => (
        <button
          key={label.id}
          onClick={() => toggle(label.id)}
          className={cn('w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors')}
          style={selected.includes(label.id)
            ? { backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }
            : { color: 'var(--text-secondary)' }
          }
        >
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: label.color || 'var(--accent)' }} />
          <span className="flex-1 text-left">{label.name}</span>
          {selected.includes(label.id) && <Check className="h-3.5 w-3.5 shrink-0" />}
        </button>
      ))}
    </div>
  )
}
