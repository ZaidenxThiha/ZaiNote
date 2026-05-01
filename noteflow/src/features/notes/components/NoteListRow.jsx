import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Pin, Lock, Users, Trash2, Share2 } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/offline/db'
import { togglePin } from '../api'
import { formatRelativeTime, stripHtml, getNoteColorStyle } from '@/lib/utils'

export function NoteListRow({ note, onDelete, onShare }) {
  const MotionDiv = motion.div
  const navigate = useNavigate()
  const isDark = document.documentElement.classList.contains('dark')
  const colorStyle = getNoteColorStyle(note.color, isDark)

  const noteLabels = useLiveQuery(
    () => db.note_labels.where('note_id').equals(note.id).toArray(),
    [note.id], []
  )
  const allLabels = useLiveQuery(() => db.labels.toArray(), [], [])
  const labelNames = (noteLabels || []).map(nl => allLabels?.find(l => l.id === nl.label_id)).filter(Boolean)

  const preview = stripHtml(note.content).slice(0, 120)

  return (
    <MotionDiv
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-start gap-4 px-4 py-3 rounded-lg cursor-pointer group transition-colors hover:bg-muted"
      style={{ borderBottom: '1px solid var(--border)' }}
      onClick={() => navigate(`/notes/${note.id}`)}
    >
      {/* Color indicator */}
      {colorStyle.backgroundColor && (
        <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: colorStyle.backgroundColor }} />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          {note.is_pinned && <Pin className="h-3 w-3 shrink-0" style={{ color: 'var(--accent)', fill: 'var(--accent)' }} />}
          {note.password_hash && <Lock className="h-3 w-3 shrink-0" style={{ color: 'var(--text-muted)' }} />}
          {note.shareId && <Users className="h-3 w-3 shrink-0" style={{ color: 'var(--text-muted)' }} />}
          <h3 className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
            {note.title || <span style={{ color: 'var(--text-muted)' }}>Untitled</span>}
          </h3>
          <span className="text-xs ml-auto shrink-0" style={{ color: 'var(--text-muted)' }}>{formatRelativeTime(note.updated_at)}</span>
        </div>
        {!note.password_hash && preview && (
          <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{preview}</p>
        )}
        {labelNames.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {labelNames.slice(0, 3).map(l => (
              <span key={l.id} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{l.name}</span>
            ))}
          </div>
        )}
      </div>

      {/* Hover actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={e => { e.stopPropagation(); togglePin(note) }} className="p-1.5 rounded-md hover:bg-muted" title="Pin">
          <Pin className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
        </button>
        <button onClick={e => { e.stopPropagation(); onShare?.(note) }} className="p-1.5 rounded-md hover:bg-muted" title="Share">
          <Share2 className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete?.(note) }} className="p-1.5 rounded-md" title="Delete">
          <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--danger)' }} />
        </button>
      </div>
    </MotionDiv>
  )
}
