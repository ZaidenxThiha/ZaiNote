import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Pin, Lock, Users, Trash2, Share2, Palette, Archive } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import * as Popover from '@radix-ui/react-popover'
import { db } from '@/services/offline/db'
import { togglePin, updateNote, archiveNote } from '../api'
import { stripHtml, getNoteColorStyle } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { ColorPicker } from './ColorPicker'
import { toast } from 'sonner'

export function NoteCard({ note, onDelete, onShare }) {
  const MotionDiv = motion.div
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  const [localColor, setLocalColor] = useState(note.color || '#ffffff')
  const isDark = document.documentElement.classList.contains('dark')
  const colorStyle = getNoteColorStyle(localColor, isDark)

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

  const handleColorChange = async (value) => {
    setLocalColor(value)
    await updateNote(note.id, { color: value })
  }

  const handleArchive = async (e) => {
    e.stopPropagation()
    await archiveNote(note.id)
    toast.success('Note archived')
  }

  const hasPassword = !!note.password_hash
  const isShared = note.note_shares?.length > 0 || note.shareId
  const preview = stripHtml(note.content).slice(0, 300)

  const bg = colorStyle.backgroundColor || 'var(--bg-secondary)'

  return (
    <MotionDiv
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="rounded-2xl cursor-pointer select-none break-inside-avoid overflow-hidden relative"
      style={{
        backgroundColor: bg,
        border: `1px solid ${hovered ? 'var(--border-strong)' : 'var(--border)'}`,
        boxShadow: hovered ? '0 4px 12px rgb(0 0 0 / 0.1)' : 'none',
        transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/notes/${note.id}`)}
    >
      <button
        onClick={handlePinClick}
        className={cn(
          'absolute top-2 right-2 p-1.5 rounded-full transition-all duration-150',
          (hovered || note.is_pinned) ? 'opacity-100' : 'opacity-0',
        )}
        style={{ backgroundColor: hovered ? 'rgba(0,0,0,0.08)' : 'transparent' }}
        title={note.is_pinned ? 'Unpin note' : 'Pin note'}
      >
        <Pin
          className="h-4 w-4"
          style={{
            color: note.is_pinned ? 'var(--text-primary)' : 'var(--text-secondary)',
            fill: note.is_pinned ? 'var(--text-primary)' : 'none',
          }}
        />
      </button>

      <div className="px-3 pt-3 pb-1">
        {note.title && (
          <h3 className="font-medium text-sm mb-1.5 pr-8 leading-snug" style={{ color: 'var(--text-primary)' }}>
            {note.title}
          </h3>
        )}

        {!hasPassword && preview && (
          <p className="text-sm line-clamp-6 leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>
            {preview}
          </p>
        )}
        {hasPassword && (
          <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>🔒 Password protected</p>
        )}

        {labelNames.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {labelNames.slice(0, 3).map(label => (
              <span
                key={label.id}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
                style={{ backgroundColor: 'rgba(0,0,0,0.08)', color: 'var(--text-secondary)' }}
              >
                {label.name}
              </span>
            ))}
            {labelNames.length > 3 && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
                style={{ backgroundColor: 'rgba(0,0,0,0.08)', color: 'var(--text-muted)' }}
              >
                +{labelNames.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {(hasPassword || isShared) && (
        <div className="flex items-center gap-1.5 px-3 pb-1 pt-0.5">
          {hasPassword && <Lock className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />}
          {isShared && <Users className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />}
        </div>
      )}

      <div
        className={cn(
          'flex items-center gap-0.5 px-1.5 py-1 transition-opacity duration-150',
          hovered ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={handleArchive}
          className="p-1.5 rounded-full hover:bg-black/10"
          title="Archive"
        >
          <Archive className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
        </button>

        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              onClick={e => e.stopPropagation()}
              className="p-1.5 rounded-full hover:bg-black/10"
              title="Change color"
            >
              <Palette className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className="z-50 rounded-lg p-2 shadow-md"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
              sideOffset={8}
              onClick={e => e.stopPropagation()}
            >
              <ColorPicker value={localColor} onChange={handleColorChange} />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        <button
          onClick={e => { e.stopPropagation(); onShare?.(note) }}
          className="p-1.5 rounded-full hover:bg-black/10"
          title="Share"
        >
          <Share2 className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete?.(note) }}
          className="p-1.5 rounded-full hover:bg-black/10"
          title="Move to Trash"
        >
          <Trash2 className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>
    </MotionDiv>
  )
}
