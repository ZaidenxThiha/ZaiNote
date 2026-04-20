# 🏗️ Architecture

## High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (PWA)                              │
│  ┌───────────────┐  ┌────────────┐  ┌──────────────────┐   │
│  │ React + Vite  │──│ Zustand    │──│ Service Worker   │   │
│  │ TailwindCSS   │  │ State      │  │ (Workbox)        │   │
│  │ shadcn/ui     │  └────────────┘  └──────────────────┘   │
│  └───────┬───────┘         │                │               │
│          │                 │                │               │
│  ┌───────▼────────────┐   ┌▼──────────┐    │               │
│  │  Dexie (IndexedDB) │◄──┤ Sync Queue │◄───┘               │
│  │  Offline Cache     │   └────┬───────┘                    │
│  └────────────────────┘        │                            │
└────────────────────────────────┼────────────────────────────┘
                                 │
                          HTTPS │ WSS
                                 │
┌────────────────────────────────▼────────────────────────────┐
│              Supabase (Backend as a Service)                 │
│  ┌─────────────┐ ┌──────────┐ ┌─────────┐ ┌─────────────┐  │
│  │ PostgreSQL  │ │ Auth     │ │ Storage │ │ Realtime    │  │
│  │ + RLS       │ │ (JWT)    │ │ (S3)    │ │ (WebSocket) │  │
│  └─────────────┘ └──────────┘ └─────────┘ └─────────────┘  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Edge Functions: send-share-email, password-otp       │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────┐
│         Cloudflare Pages (Static Hosting + CDN)              │
│            HTTPS + global edge + auto deploys                │
└──────────────────────────────────────────────────────────────┘
```

## Key Architectural Decisions

### 1. Offline-First with Sync Queue

All CRUD operations write to IndexedDB (via Dexie) **first**, then push to Supabase. A sync queue tracks pending operations:

```
User action → Dexie (immediate UI update) → Sync Queue → Supabase
                                                 │
                                      (retry with exponential backoff)
```

**Conflict resolution**: last-write-wins based on `updated_at`. For collaborative notes, Yjs CRDT handles merging.

### 2. Auto-Save Pattern

Auto-save uses **debounced** writes (800ms after last keystroke):

```javascript
const debouncedSave = useDebouncedCallback(
  (noteId, changes) => saveNote(noteId, changes),
  800
);
```

Visual indicator: `Saving... → Saved ✓` in corner of editor.

### 3. Password-Protected Notes

Two-layer approach:
- **Layer 1 (UX gate)**: bcrypt hash stored server-side. Client prompts for password before revealing content.
- **Layer 2 (optional encryption)**: content encrypted client-side with AES-GCM using PBKDF2-derived key from password. Even with direct DB access, content is ciphertext.

Password flow:
- **Enable**: enter password twice → hash + (optionally encrypt content) → store
- **Change**: enter current → verify → enter new twice → re-hash
- **Disable**: enter current → verify → remove hash + decrypt content

### 4. Real-Time Collaboration

Yjs CRDT over Supabase Realtime broadcast:

```
User A edits ──┐
User B edits ──┼──► Yjs Doc ──► Broadcast ──► All clients
User C edits ──┘      │
                      └──► Persist to notes.yjs_state every 5s
```

Awareness protocol shows other users' cursors and selections.

### 5. Sharing Flow

1. Owner enters recipient email
2. Client calls `rpc('find_user_by_email', {email})` — only returns result if user exists (no enumeration)
3. On confirm: insert into `note_shares`, create `notification`, trigger Edge Function to send email
4. Recipient sees:
   - In-app notification badge
   - "Shared with me" section with sharing metadata
5. Owner sees full list of recipients with permissions, can revoke any time

### 6. Search

Client-side live search (300ms debounce) using **both**:
- PostgreSQL full-text search (when online) via `to_tsvector` GIN index
- Dexie-based local search (when offline) using indexed title + content

## Data Flow Examples

### Creating a Note

```
1. User clicks "+ New Note"
2. Client generates UUID → writes to Dexie immediately
3. Navigate to /notes/{uuid}
4. User types title/content → debounced auto-save
5. Each save: Dexie update → enqueue sync → push to Supabase
6. Supabase returns → mark synced in Dexie
```

### Sharing a Note

```
1. User clicks "Share" → dialog opens
2. User types email → live validation via RPC
3. User selects permission (read/edit) → confirm
4. Insert note_share → insert notification → trigger edge function
5. Edge function sends email via Resend
6. Recipient: sees notification next login + email
```

### Offline Edit → Sync

```
1. User offline → edits note in cached UI
2. Changes write to Dexie, sync queue entry added
3. Connection restored → navigator.onLine event
4. Service worker message: flush sync queue
5. For each queued op: POST to Supabase
6. On 409 conflict: use server's updated_at as authority
```

## Security Considerations

- **Passwords**: bcrypt via Supabase Auth (never stored plaintext)
- **Note passwords**: bcrypt in DB + optional client-side AES-GCM encryption
- **RLS**: every table has row-level policies; nothing accessible without auth
- **Email enumeration**: `find_user_by_email` RPC returns only `{exists: boolean, user_id?: uuid}` — no other data
- **XSS**: TipTap sanitizes HTML; use DOMPurify as belt-and-suspenders
- **CSRF**: Supabase uses bearer tokens, not cookies → CSRF not applicable
- **File uploads**: validate MIME type + size client + server; store in per-user folders
- **Rate limiting**: Supabase has built-in auth rate limits; add client-side throttling for search

## Performance

- **Code splitting**: each route lazy-loaded
- **Image optimization**: compress client-side before upload (browser-image-compression)
- **Virtual list**: for 100+ notes (react-window) — optional
- **Service worker caching**: app shell + API responses with stale-while-revalidate
- **Bundle size target**: < 250KB gzipped initial load
