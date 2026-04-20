# Supabase Integration Skill

Use this skill when working with any Supabase feature in this project: Auth, database queries, Storage, Realtime, or Edge Functions.

## Client Setup

Single source of truth — always import from `src/lib/supabase.js`:

```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 }
  }
})
```

Never instantiate `createClient` elsewhere — duplicate clients cause auth session race conditions.

## Auth Patterns

### Sign Up (with auto-profile creation via trigger)
```javascript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
    data: { display_name: displayName }
  }
})
```

The DB trigger `handle_new_user` auto-inserts into `profiles`. Don't manually insert.

### Email Verification State
```javascript
const { data: { user } } = await supabase.auth.getUser()
const isVerified = !!user?.email_confirmed_at
```

Show the "unverified" banner when `isVerified === false`. The banner must NOT block features — per spec, all features work before verification.

### Password Reset with OTP
The spec requires **either** link OR OTP. Implement both:

```javascript
// Request reset (sends email with link that includes token)
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/auth/reset-password`
})

// For OTP flow: use custom table password_reset_otps
// User enters 6-digit code → verify → show new password form
```

### Session Handling
Wrap app in an `AuthProvider` that subscribes to changes:

```javascript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    }
  )
  return () => subscription.unsubscribe()
}, [])
```

## Database Queries

### Always select only what you need
```javascript
// ✅ Good
const { data } = await supabase
  .from('notes')
  .select('id, title, content, updated_at, is_pinned')
  .eq('user_id', userId)

// ❌ Bad — fetches blobs (yjs_state) unnecessarily
const { data } = await supabase.from('notes').select('*')
```

### Pagination
```javascript
const { data } = await supabase
  .from('notes')
  .select('id, title, updated_at')
  .range(0, 49)  // First 50
  .order('is_pinned', { ascending: false })
  .order('pinned_at', { ascending: false, nullsFirst: false })
  .order('updated_at', { ascending: false })
```

### Joins via foreign keys
```javascript
// Get notes with their labels
const { data } = await supabase
  .from('notes')
  .select(`
    id, title, content, updated_at,
    note_labels ( labels ( id, name, color ) ),
    note_attachments ( id, storage_path, file_name )
  `)
```

### Full-text search
```javascript
const { data } = await supabase
  .from('notes')
  .select('id, title, content')
  .textSearch('title_content_fts', query, { type: 'websearch' })

// If no fts index column, use ilike (slower but works):
.or(`title.ilike.%${query}%,content.ilike.%${query}%`)
```

## Storage Patterns

### Upload image attachment
```javascript
const path = `${userId}/${noteId}/${Date.now()}_${file.name}`
const { data, error } = await supabase.storage
  .from('note-attachments')
  .upload(path, file, {
    cacheControl: '3600',
    upsert: false
  })

// Record in DB
await supabase.from('note_attachments').insert({
  note_id: noteId,
  storage_path: path,
  file_name: file.name,
  file_size: file.size,
  mime_type: file.type
})
```

### Get signed URL (private bucket)
```javascript
const { data } = await supabase.storage
  .from('note-attachments')
  .createSignedUrl(path, 3600) // 1 hour
```

### Always compress images before upload
```javascript
import imageCompression from 'browser-image-compression'

const compressed = await imageCompression(file, {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true
})
```

## Realtime Patterns

### Subscribe to note changes (for share recipients)
```javascript
const channel = supabase
  .channel(`note:${noteId}`)
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'notes', filter: `id=eq.${noteId}` },
    (payload) => handleRemoteUpdate(payload.new)
  )
  .subscribe()

return () => supabase.removeChannel(channel)
```

### Broadcast for Yjs collab
```javascript
const channel = supabase.channel(`collab:${noteId}`, {
  config: { broadcast: { self: false } }
})

channel
  .on('broadcast', { event: 'yjs-update' }, ({ payload }) => {
    Y.applyUpdate(ydoc, new Uint8Array(payload.update))
  })
  .subscribe()

// Send updates
ydoc.on('update', (update) => {
  channel.send({
    type: 'broadcast',
    event: 'yjs-update',
    payload: { update: Array.from(update) }
  })
})
```

### Notifications (for share events)
```javascript
const channel = supabase
  .channel(`notifications:${userId}`)
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
    ({ new: notification }) => {
      toast.info(notification.title)
      incrementUnreadBadge()
    }
  )
  .subscribe()
```

## RPC Functions

For email validation when sharing (no enumeration leak):

```sql
-- Add to migrations
create or replace function public.find_user_by_email(p_email text)
returns table(user_id uuid, display_name text)
language sql security definer stable
as $$
  select id, display_name from profiles where email = p_email limit 1;
$$;

revoke all on function public.find_user_by_email from public;
grant execute on function public.find_user_by_email to authenticated;
```

```javascript
const { data } = await supabase.rpc('find_user_by_email', { p_email: email })
const userExists = data?.length > 0
```

## Error Handling

```javascript
const { data, error } = await supabase.from('notes').insert(...)
if (error) {
  console.error('Supabase error:', error)
  // Map PostgreSQL error codes to user messages
  if (error.code === '23505') toast.error('Already exists')
  else if (error.code === '42501') toast.error('Permission denied')
  else toast.error('Something went wrong')
  return
}
```

## Common Pitfalls

- **RLS blocks queries silently**: returns `data: []`, not error. Always log during dev.
- **`single()` throws on 0 rows**: use `maybeSingle()` when 0 rows is valid.
- **Realtime needs table replication enabled**: if events don't fire, check Database → Replication.
- **Large `select('*')` on notes table**: `yjs_state` is bytea, can be big — always specify columns.
- **Auth listener cleanup**: forgetting to unsubscribe leaks memory & causes duplicate handlers.
- **File uploads count against storage quota**: delete orphaned attachments when notes are deleted (cascade handles DB row, but NOT the actual file in Storage — handle via trigger or client cleanup).
