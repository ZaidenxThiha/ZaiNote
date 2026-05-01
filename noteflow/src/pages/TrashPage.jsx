import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/offline/db'
import { fetchTrashedNotes, restoreNote, permanentDeleteNote } from '@/features/notes/api'
import { useAuth } from '@/hooks/useAuth'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { stripHtml, getNoteColorStyle, formatRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { NoteCardSkeleton } from '@/components/feedback/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState'

function TrashCard({ note, onRestore, onDelete }) {
  const MotionDiv = motion.div
  const [hovered, setHovered] = useState(false)
  const isDark = document.documentElement.classList.contains('dark')
  const colorStyle = getNoteColorStyle(note.color, isDark)
  const preview = stripHtml(note.content || '').slice(0, 200)

  return (
    <MotionDiv
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
        opacity: 0.85,
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
          Trashed {formatRelativeTime(note.deleted_at)}
        </p>
      </div>

      {/* Toolbar */}
      <div
        className="flex items-center gap-0.5 px-1.5 py-1"
        style={{ opacity: hovered ? 1 : 0, transition: 'opacity 0.15s ease' }}
      >
        <button
          onClick={() => onRestore(note)}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-xs font-medium hover:bg-black/10 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          title="Restore note"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Restore
        </button>
        <button
          onClick={() => onDelete(note)}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-xs font-medium hover:bg-red-100 transition-colors ml-auto"
          style={{ color: 'var(--danger)' }}
          title="Delete forever"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete forever
        </button>
      </div>
    </MotionDiv>
  )
}

export default function TrashPage() {
  const { user } = useAuth()
  const online = useOnlineStatus()
  const [loading, setLoading] = useState(true)
  const [noteToDelete, setNoteToDelete] = useState(null)
  const [emptyConfirmOpen, setEmptyConfirmOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!user || !online) return
    try {
      await fetchTrashedNotes(user.id)
    } catch {
      // offline — show cached
    }
  }, [user, online])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const trashedNotes = useLiveQuery(
    () => user
      ? db.notes.where('user_id').equals(user.id).filter(n => !!n.deleted_at).reverse().sortBy('deleted_at')
      : [],
    [user?.id],
    null
  )

  const handleRestore = async (note) => {
    try {
      await restoreNote(note.id)
      toast.success('Note restored')
    } catch {
      toast.error('Failed to restore note')
    }
  }

  const handlePermanentDelete = async (note) => {
    setActionLoading(true)
    try {
      await permanentDeleteNote(note.id)
      toast.success('Note permanently deleted')
      setNoteToDelete(null)
    } catch {
      toast.error('Failed to delete note')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEmptyTrash = async () => {
    if (!trashedNotes?.length) return
    setActionLoading(true)
    try {
      await Promise.all(trashedNotes.map(n => permanentDeleteNote(n.id)))
      toast.success('Trash emptied')
      setEmptyConfirmOpen(false)
    } catch {
      toast.error('Failed to empty trash')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading || trashedNotes === null) {
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
          <h1 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Trash</h1>
          {trashedNotes.length > 0 && (
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>({trashedNotes.length})</span>
          )}
        </div>
        {trashedNotes.length > 0 && (
          <button
            onClick={() => setEmptyConfirmOpen(true)}
            className="text-sm px-3 py-1.5 rounded-full border transition-colors hover:bg-red-50"
            style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
          >
            Empty Trash
          </button>
        )}
      </div>

      {trashedNotes.length === 0 ? (
        <EmptyState
          title="Trash is empty"
          description="Notes you delete will appear here for recovery"
        />
      ) : (
        <>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Notes in Trash can be restored or permanently deleted.
          </p>
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
            <AnimatePresence>
              {trashedNotes.map(note => (
                <div key={note.id} className="mb-4 break-inside-avoid">
                    <TrashCard
                      note={note}
                      onRestore={handleRestore}
                      onDelete={setNoteToDelete}
                    />
                </div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Permanent delete confirmation */}
      <Dialog open={!!noteToDelete} onOpenChange={o => !o && setNoteToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" style={{ color: 'var(--danger)' }} />
              Delete forever?
            </DialogTitle>
            <DialogDescription>
              "{noteToDelete?.title || 'Untitled'}" will be permanently deleted and cannot be recovered.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setNoteToDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => handlePermanentDelete(noteToDelete)} disabled={actionLoading}>
              {actionLoading ? 'Deleting...' : 'Delete forever'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Empty trash confirmation */}
      <Dialog open={emptyConfirmOpen} onOpenChange={setEmptyConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" style={{ color: 'var(--danger)' }} />
              Empty Trash?
            </DialogTitle>
            <DialogDescription>
              All {trashedNotes.length} note{trashedNotes.length !== 1 ? 's' : ''} in Trash will be permanently deleted. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEmptyConfirmOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleEmptyTrash} disabled={actionLoading}>
              {actionLoading ? 'Emptying...' : 'Empty Trash'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
