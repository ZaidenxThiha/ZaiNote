# Real-Time Collaboration Skill

Use this skill when implementing real-time multi-user editing on shared notes (criterion #24).

## Why Yjs?

Per the spec, shared notes with edit permission must support WebSocket-based real-time collaboration where multiple users see each other's changes live. Naive approaches (diff + overwrite) cause data loss. **Yjs** is a CRDT that guarantees all participants converge to the same state without conflicts.

## Architecture

```
Editor A  ──┐
Editor B  ──┼──► Yjs Doc ──► Supabase Realtime Broadcast ──► All peers
Editor C  ──┘       │
                    └──► Periodic persist to notes.yjs_state (bytea)
```

## Dependencies

```bash
npm i yjs y-prosemirror y-protocols @tiptap/extension-collaboration @tiptap/extension-collaboration-cursor
```

## TipTap + Yjs Setup

```javascript
// src/features/notes/CollabEditor.jsx
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'
import { useEffect, useMemo } from 'react'
import { SupabaseProvider } from './SupabaseProvider'

export function CollabEditor({ noteId, user, isOwner, canEdit }) {
  const ydoc = useMemo(() => new Y.Doc(), [noteId])
  const awareness = useMemo(() => new Awareness(ydoc), [ydoc])
  
  useEffect(() => {
    const provider = new SupabaseProvider(noteId, ydoc, awareness)
    return () => provider.destroy()
  }, [noteId, ydoc, awareness])
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }), // Yjs handles history
      Collaboration.configure({ document: ydoc }),
      CollaborationCursor.configure({
        provider: { awareness },
        user: {
          name: user.display_name,
          color: stringToColor(user.id),
        }
      })
    ],
    editable: canEdit,
  }, [noteId])
  
  return <EditorContent editor={editor} />
}

function stringToColor(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  const colors = ['#ef4444','#f59e0b','#10b981','#6366f1','#8b5cf6','#ec4899']
  return colors[Math.abs(hash) % colors.length]
}
```

## Custom Supabase Yjs Provider

```javascript
// src/features/notes/SupabaseProvider.js
import * as Y from 'yjs'
import { supabase } from '@/lib/supabase'

export class SupabaseProvider {
  constructor(noteId, ydoc, awareness) {
    this.noteId = noteId
    this.ydoc = ydoc
    this.awareness = awareness
    this.channel = null
    this.persistTimer = null
    this.isDestroyed = false
    
    this.init()
  }
  
  async init() {
    // 1. Load initial state from DB
    const { data } = await supabase
      .from('notes')
      .select('yjs_state')
      .eq('id', this.noteId)
      .maybeSingle()
    
    if (data?.yjs_state) {
      const state = new Uint8Array(
        Array.isArray(data.yjs_state) ? data.yjs_state : atob(data.yjs_state).split('').map(c => c.charCodeAt(0))
      )
      Y.applyUpdate(this.ydoc, state)
    }
    
    // 2. Open broadcast channel
    this.channel = supabase.channel(`collab:${this.noteId}`, {
      config: { broadcast: { self: false, ack: false } }
    })
    
    this.channel
      .on('broadcast', { event: 'yjs-update' }, ({ payload }) => {
        if (this.isDestroyed) return
        const update = new Uint8Array(payload.update)
        Y.applyUpdate(this.ydoc, update, 'remote')
      })
      .on('broadcast', { event: 'awareness' }, ({ payload }) => {
        if (this.isDestroyed) return
        // Apply awareness update (cursors/selections)
        import('y-protocols/awareness').then(({ applyAwarenessUpdate }) => {
          applyAwarenessUpdate(this.awareness, new Uint8Array(payload.update), 'remote')
        })
      })
      .subscribe()
    
    // 3. Send local updates
    this.ydoc.on('update', this.handleLocalUpdate)
    this.awareness.on('update', this.handleAwarenessUpdate)
  }
  
  handleLocalUpdate = (update, origin) => {
    if (origin === 'remote' || this.isDestroyed) return
    
    this.channel.send({
      type: 'broadcast',
      event: 'yjs-update',
      payload: { update: Array.from(update) }
    })
    
    // Debounced persist to DB (every 5s after last edit)
    clearTimeout(this.persistTimer)
    this.persistTimer = setTimeout(() => this.persist(), 5000)
  }
  
  handleAwarenessUpdate = async ({ added, updated, removed }, origin) => {
    if (origin === 'remote' || this.isDestroyed) return
    const { encodeAwarenessUpdate } = await import('y-protocols/awareness')
    const changedClients = [...added, ...updated, ...removed]
    const update = encodeAwarenessUpdate(this.awareness, changedClients)
    
    this.channel.send({
      type: 'broadcast',
      event: 'awareness',
      payload: { update: Array.from(update) }
    })
  }
  
  async persist() {
    if (this.isDestroyed) return
    const state = Y.encodeStateAsUpdate(this.ydoc)
    // Also sync title/content text fields for list display
    const content = this.ydoc.getXmlFragment('default').toJSON()
    
    await supabase
      .from('notes')
      .update({
        yjs_state: Array.from(state),
        content: content, // serialized for search/preview
        updated_at: new Date().toISOString()
      })
      .eq('id', this.noteId)
  }
  
  destroy() {
    this.isDestroyed = true
    clearTimeout(this.persistTimer)
    this.ydoc.off('update', this.handleLocalUpdate)
    this.awareness.off('update', this.handleAwarenessUpdate)
    if (this.channel) supabase.removeChannel(this.channel)
    // Final persist
    this.persist()
  }
}
```

## Collaborator Presence UI

Show avatars of users currently viewing/editing the note:

```javascript
function CollaboratorAvatars({ awareness }) {
  const [users, setUsers] = useState([])
  
  useEffect(() => {
    const update = () => {
      const states = Array.from(awareness.getStates().values())
        .filter(s => s.user) // filter out own entry maybe
      setUsers(states.map(s => s.user))
    }
    awareness.on('change', update)
    update()
    return () => awareness.off('change', update)
  }, [awareness])
  
  return (
    <div className="flex -space-x-2">
      {users.slice(0, 5).map((user, i) => (
        <Avatar key={i} style={{ borderColor: user.color }} name={user.name} />
      ))}
      {users.length > 5 && <span>+{users.length - 5}</span>}
    </div>
  )
}
```

## Non-Collaborative Notes

For private (non-shared) notes, **don't use Yjs**. Plain TipTap + auto-save to `content` field is lighter and simpler. Switch based on `note.is_shared` flag.

```javascript
{note.is_shared_with_edit ? <CollabEditor /> : <SimpleEditor />}
```

## Database Consideration

`yjs_state` is a binary column. When sending via Supabase JS, serialize as a number array (JSON-safe) or base64. The examples above use number arrays for simplicity.

## Testing

1. Share a note with another test account, give edit permission
2. Open note in two browsers (or regular + incognito)
3. Type in one → see text appear in the other within ~200ms
4. Move cursor → see remote cursor with colored label
5. Both edit simultaneously → both changes merge correctly
6. Close one, reopen → state restored from DB

## Common Pitfalls

- **Applying own updates as remote**: check origin! Infinite loop disaster.
- **Large yjs_state**: if a doc has decades of history, state grows. Periodically compact with `Y.encodeStateAsUpdate` (which gives current state, not history).
- **Awareness leak on disconnect**: call `awareness.setLocalState(null)` on unmount.
- **Channel name collisions**: use `collab:${noteId}` prefix to avoid mixing with other channels.
- **Rate limits**: Supabase Realtime has message rate limits. If users type fast, debounce updates or batch (Yjs already does this to some extent).
