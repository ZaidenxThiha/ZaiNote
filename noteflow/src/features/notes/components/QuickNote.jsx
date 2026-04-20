import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { PenLine } from 'lucide-react'
import { createNote } from '@/features/notes/api'
import { useAuth } from '@/hooks/useAuth'
import { updateNote } from '@/features/notes/api'

export function QuickNote() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const containerRef = useRef(null)

  const handleExpand = () => {
    setExpanded(true)
  }

  const handleCancel = () => {
    setExpanded(false)
    setTitle('')
    setContent('')
  }

  const handleDone = async () => {
    if (!user) return
    try {
      const note = await createNote(user.id)
      if (title || content) {
        await updateNote(note.id, { title, content })
      }
      setExpanded(false)
      setTitle('')
      setContent('')
      navigate(`/notes/${note.id}`)
    } catch {
      handleCancel()
    }
  }

  if (!expanded) {
    return (
      <div className="mb-4">
        <button
          onClick={handleExpand}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm text-left transition-colors"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
          }}
        >
          <PenLine className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
          Take a note...
        </button>
      </div>
    )
  }

  return (
    <div className="mb-4" ref={containerRef}>
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-strong)',
          boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)',
        }}
      >
        <div className="px-4 pt-3">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-sm font-medium mb-2"
            style={{ color: 'var(--text-primary)' }}
            autoFocus
          />
          <textarea
            placeholder="Note..."
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={3}
            className="w-full bg-transparent border-none outline-none text-sm resize-none"
            style={{ color: 'var(--text-secondary)' }}
          />
        </div>
        <div className="flex items-center justify-end gap-2 px-3 py-2">
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 rounded-md text-xs font-medium hover:bg-black/10 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleDone}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-white transition-colors"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
