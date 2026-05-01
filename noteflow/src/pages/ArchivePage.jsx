import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Archive, RotateCcw, Trash2 } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/offline/db'
import { fetchArchivedNotes, unarchiveNote, trashNote } from '@/features/notes/api'
import { useAuth } from '@/hooks/useAuth'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { stripHtml, getNoteColorStyle, formatRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'
import { NoteCardSkeleton } from '@/components/feedback/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState'

function ArchiveCard({ note, onUnarchive, onTrash }) {
  const [hovered, setHovered] = useState(false)
  const isDark = document.documentElement.classList.contains('dark')
  const colorStyle = getNoteColorStyle(note.color, isDark)
  const preview = stripHtml(note.content || '').slice(0, 200)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="rounded-2xl break-inside-avoid overflow-hidden"
      style={{
        backgroundColor: colorStyle.backgroundColor || 'var(--bg-secondary)',
        border: `1px solid ${hovered ? 'var(--border-strong)' : 'var(--border)'}`,
        boxShadow: hovered ? '0 4px 12px rgb(0 0 0 / 0.1)' : 'none',
        transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="px-3 pt-3 pb-1">
        {note.title && (
          <h3 className="font-medium text-sm mb-1.5 leading-snug" style={{ color: 'var(--text-primary)' }}>
            {note.title}
          </h3>
        )}
        {preview && (
          <p className="text-sm line-clamp-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {preview}
          </p>
        )}
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          Archived {formatRelativeTime(note.updated_at)}
        </p>
      </div>

      <div
        className="flex items-center gap-0.5 px-1.5 py-1"
        style={{ opacity: hovered ? 1 : 0, transition: 'opacity 0.15s ease' }}
      >
        <button
          onClick={() => onUnarchive(note)}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-xs font-medium hover:bg-black/10 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          title="Unarchive note"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Unarchive
        </button>
        <button
          onClick={() => onTrash(note)}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-xs font-medium hover:bg-red-100 transition-colors ml-auto"
          style={{ color: 'var(--danger)' }}
          title="Move to Trash"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Trash
        </button>
      </div>
    </motion.div>
  )
}

export default function ArchivePage() {
  const { user } = useAuth()
  const online = useOnlineStatus()
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user || !online) return
    try {
      await fetchArchivedNotes(user.id)
    } catch {
      // Show cached Dexie data if the refresh fails.
    }
  }, [user, online])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const archivedNotes = useLiveQuery(
    () => user
      ? db.notes.where('user_id').equals(user.id).filter(n => !!n.is_archived && !n.deleted_at).reverse().sortBy('updated_at')
      : [],
    [user?.id],
    null
  )

  const handleUnarchive = async (note) => {
    try {
      await unarchiveNote(note.id)
      toast.success('Note unarchived')
    } catch {
      toast.error('Failed to unarchive note')
    }
  }

  const handleTrash = async (note) => {
    try {
      await trashNote(note.id)
      toast.success('Note moved to Trash')
    } catch {
      toast.error('Failed to move note to Trash')
    }
  }

  if (loading || archivedNotes === null) {
    return (
      <div className="p-4">
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="mb-4"><NoteCardSkeleton /></div>)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center gap-2 mb-6">
        <Archive className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
        <h1 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Archive</h1>
        {archivedNotes.length > 0 && (
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>({archivedNotes.length})</span>
        )}
      </div>

      {archivedNotes.length === 0 ? (
        <EmptyState
          title="Archive is empty"
          description="Notes you archive will appear here"
        />
      ) : (
        <>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Archived notes are hidden from the main view. You can unarchive them at any time.
          </p>
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
            <AnimatePresence>
              {archivedNotes.map(note => (
                <div key={note.id} className="mb-4 break-inside-avoid">
                  <ArchiveCard
                    note={note}
                    onUnarchive={handleUnarchive}
                    onTrash={handleTrash}
                  />
                </div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  )
}
