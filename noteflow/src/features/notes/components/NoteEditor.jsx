import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Pin, Lock, Share2, Palette, Paperclip, Trash2, ArrowLeft, Bold, Italic, List, Heading2, Strikethrough, ListOrdered, Code, Copy, Archive } from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'
import { SaveIndicator } from '@/components/feedback/SaveIndicator'
import { ColorPicker } from './ColorPicker'
import { AttachmentUploader } from './AttachmentUploader'
import { useAutoSave } from '../hooks/useAutoSave'
import { togglePin, duplicateNote, archiveNote } from '../api'
import { getNoteColorStyle, stripHtml } from '@/lib/utils'
import { toast } from 'sonner'

export function NoteEditor({ note, onLockClick, onShareClick, onDeleteClick, onUpdate }) {
  const navigate = useNavigate()
  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [color, setColor] = useState(note?.color || '#ffffff')
  const [attachments, setAttachments] = useState(note?.note_attachments || [])
  const isDark = document.documentElement.classList.contains('dark')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
      }),
      Image,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Start writing...' }),
    ],
    content,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML())
    },
  })

  const saveStatus = useAutoSave(
    note?.id,
    { title, content, color },
    800
  )

  useEffect(() => {
    if (!note) return
    setTitle(note.title || '')
    setContent(note.content || '')
    setColor(note.color || '#ffffff')
    setAttachments(note.note_attachments || [])
  }, [note?.id])

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '', false)
    }
  }, [content, editor])

  const colorStyle = getNoteColorStyle(color, isDark)

  const wordCount = content ? stripHtml(content).trim().split(/\s+/).filter(Boolean).length : 0

  const handleDuplicate = async () => {
    try {
      const newNote = await duplicateNote(note)
      toast.success('Note duplicated')
      navigate(`/notes/${newNote.id}`)
    } catch {
      toast.error('Failed to duplicate note')
    }
  }

  const handleArchive = async () => {
    try {
      await archiveNote(note.id)
      toast.success('Note archived')
      navigate(-1)
    } catch {
      toast.error('Failed to archive note')
    }
  }

  if (!note) return null

  return (
    <div className="flex flex-col h-full" style={{ ...colorStyle, backgroundColor: colorStyle.backgroundColor || 'var(--bg-primary)' }}>
      <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: 'var(--border)', backgroundColor: colorStyle.backgroundColor || 'var(--bg-secondary)' }}>
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-md hover:bg-black/10" title="Back">
          <ArrowLeft className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
        </button>

        {editor && (
          <div className="flex items-center gap-0.5 border rounded-md px-1" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded text-sm ${editor.isActive('bold') ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
              title="Bold"
            >
              <Bold className="h-3.5 w-3.5" style={{ color: 'var(--text-primary)' }} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded text-sm ${editor.isActive('italic') ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
              title="Italic"
            >
              <Italic className="h-3.5 w-3.5" style={{ color: 'var(--text-primary)' }} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-1.5 rounded text-sm ${editor.isActive('bulletList') ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
              title="List"
            >
              <List className="h-3.5 w-3.5" style={{ color: 'var(--text-primary)' }} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-1.5 rounded text-sm ${editor.isActive('heading', { level: 2 }) ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
              title="Heading"
            >
              <Heading2 className="h-3.5 w-3.5" style={{ color: 'var(--text-primary)' }} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-1.5 rounded text-sm ${editor.isActive('strike') ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
              title="Strikethrough"
            >
              <Strikethrough className="h-3.5 w-3.5" style={{ color: 'var(--text-primary)' }} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-1.5 rounded text-sm ${editor.isActive('orderedList') ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
              title="Ordered list"
            >
              <ListOrdered className="h-3.5 w-3.5" style={{ color: 'var(--text-primary)' }} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={`p-1.5 rounded text-sm ${editor.isActive('code') ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
              title="Code"
            >
              <Code className="h-3.5 w-3.5" style={{ color: 'var(--text-primary)' }} />
            </button>
          </div>
        )}

        <div className="flex-1" />

        <SaveIndicator status={saveStatus} />

        <div className="flex items-center gap-1">
          <button
            onClick={() => togglePin(note)}
            className="p-1.5 rounded-md hover:bg-black/10"
            title={note.is_pinned ? 'Unpin' : 'Pin'}
          >
            <Pin className="h-4 w-4" style={{ color: note.is_pinned ? 'var(--accent)' : 'var(--text-muted)', fill: note.is_pinned ? 'var(--accent)' : 'none' }} />
          </button>

          <Popover.Root>
            <Popover.Trigger asChild>
              <button className="p-1.5 rounded-md hover:bg-black/10" title="Color">
                <Palette className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content className="z-50 rounded-lg p-2 shadow-md" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }} sideOffset={8}>
                <ColorPicker value={color} onChange={setColor} />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>

          <button
            onClick={handleDuplicate}
            className="p-1.5 rounded-md hover:bg-black/10"
            title="Duplicate note"
          >
            <Copy className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
          </button>

          <button
            onClick={handleArchive}
            className="p-1.5 rounded-md hover:bg-black/10"
            title="Archive note"
          >
            <Archive className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
          </button>

          <button className="p-1.5 rounded-md hover:bg-black/10" title="Lock" onClick={onLockClick}>
            <Lock className="h-4 w-4" style={{ color: note.password_hash ? 'var(--accent)' : 'var(--text-muted)' }} />
          </button>
          <button className="p-1.5 rounded-md hover:bg-black/10" title="Share" onClick={onShareClick}>
            <Share2 className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
          </button>
          <button className="p-1.5 rounded-md hover:bg-red-100" title="Delete" onClick={onDeleteClick}>
            <Trash2 className="h-4 w-4" style={{ color: 'var(--danger)' }} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-3xl mx-auto w-full">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full text-2xl font-bold bg-transparent border-none outline-none mb-4"
          style={{ color: 'var(--text-primary)' }}
        />
        <EditorContent editor={editor} className="prose-sm max-w-none" />

        <div className="flex justify-end mt-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {wordCount} word{wordCount !== 1 ? 's' : ''}
          </span>
        </div>

        {attachments.length > 0 || true ? (
          <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Attachments</p>
            <AttachmentUploader
              noteId={note.id}
              attachments={attachments}
              onAttachmentsChange={setAttachments}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
