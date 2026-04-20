import { useState, useMemo } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { NoteCard } from '@/features/notes/components/NoteCard'
import { NoteListRow } from '@/features/notes/components/NoteListRow'
import { DeleteNoteDialog } from '@/features/notes/dialogs/DeleteNoteDialog'
import { ShareDialog } from '@/features/sharing/components/ShareDialog'
import { EmptyState } from '@/components/feedback/EmptyState'
import { NoteCardSkeleton } from '@/components/feedback/Skeleton'
import { LabelManager } from '@/features/labels/components/LabelManager'
import { useNotes } from '@/features/notes/hooks/useNotes'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { createNote } from '@/features/notes/api'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Tag, Plus } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { stripHtml } from '@/lib/utils'

export default function NotesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { search = '', view = 'grid', activeLabel } = useOutletContext() || {}
  const debouncedSearch = useDebouncedValue(search, 300)

  const { notes, loading } = useNotes()
  const [noteToDelete, setNoteToDelete] = useState(null)
  const [noteToShare, setNoteToShare] = useState(null)
  const [labelManagerOpen, setLabelManagerOpen] = useState(false)

  useKeyboardShortcuts({
    'cmd+n': () => handleNewNote(),
    'ctrl+n': () => handleNewNote(),
  })

  const handleNewNote = async () => {
    if (!user) return
    const note = await createNote(user.id)
    navigate(`/notes/${note.id}`)
  }

  const filtered = useMemo(() => {
    let result = [...notes]

    // Search filter
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter(n =>
        n.title?.toLowerCase().includes(q) ||
        stripHtml(n.content || '').toLowerCase().includes(q)
      )
    }

    // Label filter
    if (activeLabel) {
      result = result.filter(n =>
        n.note_labels?.some(nl => nl.label_id === activeLabel)
      )
    }

    // Sort: pinned first (by pinned_at desc), then by updated_at desc
    result.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1
      if (a.is_pinned && b.is_pinned) return new Date(b.pinned_at) - new Date(a.pinned_at)
      return new Date(b.updated_at) - new Date(a.updated_at)
    })

    return result
  }, [notes, debouncedSearch, activeLabel])

  const pinned = filtered.filter(n => n.is_pinned)
  const others = filtered.filter(n => !n.is_pinned)

  if (loading) {
    return (
      <div className="p-4">
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="mb-4"><NoteCardSkeleton /></div>)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 pb-20">
      {/* Label manager button */}
      <div className="flex items-center justify-between mb-4">
        <div />
        <button
          onClick={() => setLabelManagerOpen(true)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors hover:bg-muted"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          <Tag className="h-3.5 w-3.5" />
          Manage Labels
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={debouncedSearch ? 'No notes found' : 'No notes yet'}
          description={debouncedSearch ? `No results for "${debouncedSearch}"` : 'Create your first note to get started'}
          action={!debouncedSearch && (
            <Button onClick={handleNewNote}>
              <Plus className="h-4 w-4" />
              New note
            </Button>
          )}
        />
      ) : (
        <>
          {pinned.length > 0 && (
            <section className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: 'var(--text-muted)' }}>Pinned</p>
              {view === 'grid' ? (
                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
                  <AnimatePresence>
                    {pinned.map(note => (
                      <div key={note.id} className="mb-4 break-inside-avoid">
                        <NoteCard note={note} onDelete={setNoteToDelete} onShare={setNoteToShare} />
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div>
                  <AnimatePresence>
                    {pinned.map(note => <NoteListRow key={note.id} note={note} onDelete={setNoteToDelete} onShare={setNoteToShare} />)}
                  </AnimatePresence>
                </div>
              )}
            </section>
          )}

          {others.length > 0 && (
            <section>
              {pinned.length > 0 && <p className="text-xs font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: 'var(--text-muted)' }}>Others</p>}
              {view === 'grid' ? (
                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
                  <AnimatePresence>
                    {others.map(note => (
                      <div key={note.id} className="mb-4 break-inside-avoid">
                        <NoteCard note={note} onDelete={setNoteToDelete} onShare={setNoteToShare} />
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div>
                  <AnimatePresence>
                    {others.map(note => <NoteListRow key={note.id} note={note} onDelete={setNoteToDelete} onShare={setNoteToShare} />)}
                  </AnimatePresence>
                </div>
              )}
            </section>
          )}
        </>
      )}

      {/* Delete dialog */}
      {noteToDelete && (
        <DeleteNoteDialog
          note={noteToDelete}
          open={!!noteToDelete}
          onOpenChange={o => !o && setNoteToDelete(null)}
          onDeleted={() => setNoteToDelete(null)}
        />
      )}

      {/* Share dialog */}
      {noteToShare && (
        <ShareDialog
          note={noteToShare}
          open={!!noteToShare}
          onOpenChange={o => !o && setNoteToShare(null)}
        />
      )}

      {/* Label Manager Dialog */}
      <Dialog.Root open={labelManagerOpen} onOpenChange={setLabelManagerOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-lg p-6 shadow-md" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Manage Labels</Dialog.Title>
              <Dialog.Close className="p-1 rounded hover:bg-muted">
                <span className="h-4 w-4" style={{ color: 'var(--text-muted)' }}>✕</span>
              </Dialog.Close>
            </div>
            <LabelManager />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
