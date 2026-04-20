import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { NoteEditor } from '@/features/notes/components/NoteEditor'
import { UnlockDialog } from '@/features/notes/dialogs/UnlockDialog'
import { DeleteNoteDialog } from '@/features/notes/dialogs/DeleteNoteDialog'
import { PasswordLockDialog } from '@/features/notes/dialogs/PasswordLockDialog'
import { ShareDialog } from '@/features/sharing/components/ShareDialog'
import { LabelPicker } from '@/features/labels/components/LabelPicker'
import { useNote } from '@/features/notes/hooks/useNotes'
import { createNote, fetchNotes } from '@/features/notes/api'
import { useUnlockedNotesStore } from '@/stores/unlockedNotesStore'
import { useAuth } from '@/hooks/useAuth'
import { NoteCardSkeleton } from '@/components/feedback/Skeleton'
import * as Popover from '@radix-ui/react-popover'
import { Tag } from 'lucide-react'
import { db } from '@/services/offline/db'
import { supabase } from '@/lib/supabase'

export default function NoteEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isUnlocked = useUnlockedNotesStore(s => s.isUnlocked)
  const [unlockOpen, setUnlockOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [lockOpen, setLockOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [initializing, setInitializing] = useState(id === 'new')

  // Handle new note creation
  useEffect(() => {
    if (id === 'new' && user) {
      createNote(user.id).then(note => {
        navigate(`/notes/${note.id}`, { replace: true })
        setInitializing(false)
      })
    }
  }, [id, user])

  // Fetch from server if not in Dexie yet
  useEffect(() => {
    if (id && id !== 'new' && user) {
      db.notes.get(id).then(async (local) => {
        if (!local) {
          const { data } = await supabase.from('notes').select('*, note_labels(label_id), note_attachments(*)').eq('id', id).single()
          if (data) db.notes.put(data)
        }
      })
    }
  }, [id, user])

  const note = useNote(id)

  if (initializing || (id !== 'new' && !note)) {
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <NoteCardSkeleton />
      </div>
    )
  }

  if (!note) return null

  const locked = !!note.password_hash && !isUnlocked(note.id)

  if (locked) {
    return (
      <UnlockDialog
        note={note}
        open={true}
        onOpenChange={(o) => { if (!o) navigate(-1) }}
      />
    )
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col lg:flex-row">
      <div className="flex-1 min-w-0 h-full overflow-hidden">
        <NoteEditor
          note={note}
          onLockClick={() => setLockOpen(true)}
          onShareClick={() => setShareOpen(true)}
          onDeleteClick={() => setDeleteOpen(true)}
        />
      </div>

      {/* Side panel — desktop */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 overflow-y-auto p-4 gap-4" style={{ borderLeft: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Labels</p>
          <LabelPicker noteId={note.id} />
        </div>
      </aside>

      {/* Mobile label popover */}
      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            className="fixed bottom-20 right-4 lg:hidden p-3 rounded-full shadow-md"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
          >
            <Tag className="h-5 w-5" style={{ color: 'var(--accent)' }} />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content className="z-50 w-48 rounded-lg p-3 shadow-md" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }} side="top" sideOffset={8}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Labels</p>
            <LabelPicker noteId={note.id} />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {/* Dialogs */}
      <DeleteNoteDialog
        note={note}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => navigate('/')}
      />
      <PasswordLockDialog
        note={note}
        open={lockOpen}
        onOpenChange={setLockOpen}
        onSuccess={() => {}}
      />
      <ShareDialog
        note={note}
        open={shareOpen}
        onOpenChange={setShareOpen}
      />
    </div>
  )
}
