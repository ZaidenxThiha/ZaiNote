import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Pin, Lock, Users, Trash2, Share2, Tag } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/offline/db'
import { togglePin, deleteNote } from '../api'
import { formatRelativeTime, stripHtml, getNoteColorStyle } from '@/lib/utils'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { cn } from '@/lib/utils'

export function NoteCard({ note, onDelete, onShare }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  const isDark = document.documentElement.classList.contains('dark')
  const colorStyle = getNoteColorStyle(note.color, isDark)

  const noteLabels = useLiveQuery(
    () => db.note_labels.where('note_id').equals(note.id).toArray(),
    [note.id],
    []
  )
  const allLabels = useLiveQuery(() => db.labels.toArray(), [], [])

  const labelNames = (noteLabels || [])
    .map(nl => allLabels?.find(l => l.id === nl.label_id))
    .filter(Boolean)

  const handlePinClick = async (e) => {
    e.stopPropagation()
    await togglePin(note)
  }

  const hasPassword = !!note.password_hash
  const isShared = note.note_shares?.length > 0 || note.shareId

  const preview = stripHtml(note.content).slice(0, 200)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'rounded-lg cursor-pointer select-none break-inside-avoid overflow-hidden',
        'transition-shadow duration-150 group',
      )}
      style={{
        border: `1px solid ${hovered ? 'var(--border-strong)' : 'var(--border)'}`,
        boxShadow: hovered ? '0 4px 6px -1px rgb(0 0 0 / 0.08)' : '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        ...colorStyle,
        backgroundColor: colorStyle.backgroundColor || 'var(--bg-secondary)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/notes/${note.id}`)}
    >
      {/* Card content */}
      <div className="p-3">
        {/* Status icons row */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-1">
            {note.is_pinned && <Pin className="h-3 w-3" style={{ color: 'var(--accent)', fill: 'var(--accent)' }} />}
            {hasPassword && <Lock className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />}
            {isShared && <Users className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />}
          </div>
        </div>

        {/* Title */}
        {note.title && (
          <h3 className="font-semibold text-sm mb-1 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
            {note.title}
          </h3>
        )}

        {/* Content preview */}
        {preview && !hasPassword && (
          <p className="text-sm line-clamp-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {preview}
          </p>
        )}
        {hasPassword && (
          <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>🔒 Password protected</p>
        )}

        {/* Label chips */}
        {labelNames.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {labelNames.slice(0, 2).map(label => (
              <span
                key={label.id}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
              >
                {label.name}
              </span>
            ))}
            {labelNames.length > 2 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                +{labelNames.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {formatRelativeTime(note.updated_at)}
          </span>
        </div>
      </div>

      {/* Hover actions */}
      <div
        className={cn(
          'flex items-center gap-1 px-2 pb-2 transition-opacity duration-150',
          hovered ? 'opacity-100' : 'opacity-0'
        )}
      >
        <button
          onClick={handlePinClick}
          className="p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10"
          title={note.is_pinned ? 'Unpin' : 'Pin'}
        >
          <Pin className={cn('h-3.5 w-3.5', note.is_pinned ? '' : '')} style={{ color: note.is_pinned ? 'var(--accent)' : 'var(--text-muted)' }} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onShare?.(note) }}
          className="p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10"
          title="Share"
        >
          <Share2 className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete?.(note) }}
          className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--danger)' }} />
        </button>
      </div>
    </motion.div>
  )
}
