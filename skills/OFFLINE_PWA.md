# Offline PWA & Sync Skill

Use this skill when implementing offline functionality, IndexedDB caching, sync queues, or service worker behavior.

## Dexie Schema (src/services/offline/db.js)

```javascript
import Dexie from 'dexie'

export const db = new Dexie('NoteFlowDB')

db.version(1).stores({
  // Local note cache (mirrors server notes table)
  notes: 'id, user_id, updated_at, is_pinned, [user_id+updated_at]',
  
  // Labels cache
  labels: 'id, user_id, name, [user_id+name]',
  
  // Note-label links
  noteLabels: '[noteId+labelId], noteId, labelId',
  
  // Pending sync operations
  syncQueue: '++id, entity, operation, entityId, timestamp, retries',
  
  // Attachments cache (metadata only, not blobs)
  attachments: 'id, noteId, storage_path',
  
  // User profile cache
  profile: 'id'
})

// Types of sync operations
// entity: 'note' | 'label' | 'note_label' | 'attachment'
// operation: 'create' | 'update' | 'delete'
```

## Write-Through Pattern

Every CRUD op writes to Dexie **first**, queues sync, then pushes to Supabase:

```javascript
// src/services/notes.js
export async function createNote({ title = '', content = '' }) {
  const user = getCurrentUser()
  const note = {
    id: crypto.randomUUID(),
    user_id: user.id,
    title,
    content,
    is_pinned: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    _synced: false
  }
  
  // 1. Write to local (immediate UI update)
  await db.notes.add(note)
  
  // 2. Queue for sync
  await db.syncQueue.add({
    entity: 'note',
    operation: 'create',
    entityId: note.id,
    payload: note,
    timestamp: Date.now(),
    retries: 0
  })
  
  // 3. Trigger sync (non-blocking)
  syncManager.flush()
  
  return note
}
```

## Sync Manager

```javascript
// src/services/sync/syncManager.js
import { supabase } from '@/lib/supabase'
import { db } from '../offline/db'

class SyncManager {
  constructor() {
    this.isSyncing = false
    this.onlineListenerAdded = false
    this.init()
  }
  
  init() {
    if (this.onlineListenerAdded) return
    window.addEventListener('online', () => this.flush())
    this.onlineListenerAdded = true
  }
  
  async flush() {
    if (!navigator.onLine || this.isSyncing) return
    this.isSyncing = true
    
    try {
      const queue = await db.syncQueue
        .orderBy('timestamp')
        .toArray()
      
      for (const item of queue) {
        try {
          await this.processItem(item)
          await db.syncQueue.delete(item.id)
        } catch (err) {
          console.error('Sync failed:', err)
          // Exponential backoff: retries 0,1,2,3 → delays 0, 2s, 4s, 8s
          if (item.retries >= 5) {
            console.error('Max retries, dropping:', item)
            await db.syncQueue.delete(item.id)
          } else {
            await db.syncQueue.update(item.id, { retries: item.retries + 1 })
          }
          break // stop batch on error, retry on next flush
        }
      }
    } finally {
      this.isSyncing = false
    }
  }
  
  async processItem({ entity, operation, entityId, payload }) {
    if (entity === 'note') {
      if (operation === 'create' || operation === 'update') {
        const { _synced, ...cleanPayload } = payload
        const { error } = await supabase
          .from('notes')
          .upsert(cleanPayload)
        if (error) throw error
        await db.notes.update(entityId, { _synced: true })
      } else if (operation === 'delete') {
        const { error } = await supabase
          .from('notes')
          .delete()
          .eq('id', entityId)
        if (error) throw error
      }
    }
    // ... handle labels, note_labels, attachments
  }
}

export const syncManager = new SyncManager()
```

## Initial Sync on Login

When user logs in or app opens online:

```javascript
export async function pullFromServer() {
  const user = getCurrentUser()
  
  // Get last sync timestamp
  const lastSync = localStorage.getItem('lastSync') || '1970-01-01'
  
  // Pull notes modified since lastSync
  const { data: notes, error } = await supabase
    .from('notes')
    .select('*')
    .gte('updated_at', lastSync)
    .order('updated_at', { ascending: false })
  
  if (error) throw error
  
  // Merge with local (server wins for newer timestamps)
  for (const serverNote of notes) {
    const localNote = await db.notes.get(serverNote.id)
    if (!localNote || new Date(serverNote.updated_at) > new Date(localNote.updated_at)) {
      await db.notes.put({ ...serverNote, _synced: true })
    }
  }
  
  localStorage.setItem('lastSync', new Date().toISOString())
}
```

## React Hook for Reading Data

Use Dexie's `useLiveQuery` — UI auto-updates when local DB changes:

```javascript
import { useLiveQuery } from 'dexie-react-hooks'

function NotesList() {
  const notes = useLiveQuery(async () => {
    const user = getCurrentUser()
    return db.notes
      .where('user_id').equals(user.id)
      .reverse()
      .sortBy('updated_at')
  })
  
  if (!notes) return <Skeleton />
  return <>{notes.map(n => <NoteCard key={n.id} note={n} />)}</>
}
```

This gives **reactive, offline-first, instant UI** — no loading spinner on every navigation.

## Service Worker (Workbox via vite-plugin-pwa)

Config lives in `vite.config.js`. Strategy:

- **App shell** (JS, CSS, HTML): `precache` — served from cache instantly
- **Supabase REST API**: `NetworkFirst` with 5s timeout — fresh data when online, cached when not
- **Supabase Storage (images)**: `CacheFirst` — images rarely change, cache aggressively
- **Fonts**: `CacheFirst` — immutable after deploy

## Online Status Hook

```javascript
// src/hooks/useOnlineStatus.js
import { useEffect, useState } from 'react'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  return isOnline
}
```

Show a subtle "Offline — changes will sync when you reconnect" banner when `!isOnline`.

## Conflict Resolution

For non-collaborative notes: **last-write-wins** by `updated_at`.

For collab-enabled notes: Yjs CRDT auto-merges — no conflicts possible. See REALTIME_COLLAB skill.

## Testing Offline

1. Chrome DevTools → Network → throttling → Offline
2. Verify:
   - App still loads (precached)
   - Can navigate between notes (cached)
   - Can create/edit notes (Dexie writes)
   - Sync indicator shows "Offline"
3. Toggle back to Online
4. Verify:
   - Sync queue flushes
   - Server and local reconcile
   - Sync indicator shows "Synced"

## Common Pitfalls

- **Race condition on login**: user logs in → `pullFromServer` → but Dexie might have stale data from previous user. **Clear Dexie on logout.**
- **Dexie migrations**: if schema changes, bump version. Users with old schema will auto-migrate.
- **IndexedDB quotas**: mobile Safari can evict under pressure. Don't assume data persists forever.
- **Upload attachments offline**: not possible (file binary > queue size). Show "Upload will complete when online" and retry.
- **Deleting on server but not locally**: on pull, also check for deletions via `deleted_at` soft-delete column OR track server-side timestamps and cull local records not in server response since last sync.
