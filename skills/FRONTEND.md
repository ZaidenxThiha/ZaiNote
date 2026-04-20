# Frontend UI & Component Patterns Skill

Use this skill when building React components, managing state, or implementing UI interactions.

## Stack Summary

- **React 18** + **Vite** — build tool
- **TailwindCSS** — all styling (no CSS files except globals)
- **shadcn/ui** — primitive components (install as needed, not as package)
- **Zustand** — global state (lighter than Redux, no boilerplate)
- **React Router v6** — routing
- **TanStack Query (optional)** — server state if not using Dexie useLiveQuery everywhere
- **Framer Motion** — layout & complex animations
- **TipTap** — rich text editor
- **Lucide React** — icons

## Project Structure (enforce this)

```
src/
├── components/         # Reusable, feature-agnostic
│   ├── ui/            # shadcn primitives (Button, Dialog, etc.)
│   ├── layout/        # Header, Sidebar, Shell
│   └── feedback/      # Toast, Skeleton, EmptyState
├── features/          # Feature modules (auth, notes, labels, sharing)
│   └── notes/
│       ├── components/    # NoteCard, NoteGrid, NoteEditor
│       ├── hooks/         # useNote, useNotes
│       ├── api/           # Supabase calls
│       └── index.js       # barrel export
├── hooks/             # Cross-feature hooks (useAuth, useOnlineStatus)
├── lib/               # supabase client, utils
├── pages/             # Route components (thin, compose features)
├── stores/            # Zustand stores
├── services/          # offline/, sync/
├── styles/
│   └── globals.css    # Tailwind + CSS vars
└── App.jsx
```

**Rule**: `features/` can import from `components/` `hooks/` `lib/` but never from another feature. Cross-feature communication goes through stores or events.

## Theme System (CSS Variables)

`src/styles/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 98%;
    --foreground: 20 14% 10%;
    --card: 0 0% 100%;
    --border: 20 6% 90%;
    --primary: 239 84% 67%;
    --primary-foreground: 0 0% 100%;
    --muted: 20 6% 96%;
    --muted-foreground: 25 5% 45%;
    --accent: 239 84% 67%;
    --destructive: 0 84% 60%;
    --ring: 239 84% 67%;
    --radius: 0.5rem;
  }
  
  .dark {
    --background: 20 14% 4%;
    --foreground: 0 0% 98%;
    --card: 20 14% 10%;
    --border: 20 6% 16%;
    --primary: 234 89% 74%;
    --muted: 20 6% 16%;
    --muted-foreground: 25 5% 55%;
  }
  
  /* User-adjustable font size */
  html[data-font-size="small"] { font-size: 14px; }
  html[data-font-size="medium"] { font-size: 16px; }
  html[data-font-size="large"] { font-size: 18px; }
}
```

Tailwind config maps these:
```javascript
colors: {
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
  // ...
}
```

## Auth State (Zustand)

```javascript
// src/stores/authStore.js
import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export const useAuth = create((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,
  
  setSession: async (session) => {
    set({ session, user: session?.user ?? null })
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      set({ profile })
    } else {
      set({ profile: null })
    }
    set({ loading: false })
  },
  
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null, session: null })
    // Also clear Dexie + unlockedNotes elsewhere
  }
}))
```

Initialize once in `App.jsx`:
```javascript
useEffect(() => {
  supabase.auth.getSession().then(({ data }) => useAuth.getState().setSession(data.session))
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
    useAuth.getState().setSession(session)
  })
  return () => subscription.unsubscribe()
}, [])
```

## Routes & Guards

```javascript
// src/App.jsx
<BrowserRouter>
  <Routes>
    <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
    <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
    <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
    <Route path="/auth/callback" element={<AuthCallbackPage />} />
    
    <Route element={<RequireAuth><AppShell /></RequireAuth>}>
      <Route path="/" element={<NotesPage />} />
      <Route path="/notes/:id" element={<NoteEditorPage />} />
      <Route path="/shared" element={<SharedNotesPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Route>
    
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
</BrowserRouter>
```

```javascript
function RequireAuth({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />
  return children
}
```

## Auto-Save Hook

```javascript
// src/features/notes/hooks/useAutoSave.js
import { useEffect, useRef, useState } from 'react'

export function useAutoSave(value, onSave, delay = 800) {
  const [status, setStatus] = useState('saved') // 'saved' | 'saving' | 'error'
  const isFirstRun = useRef(true)
  const timer = useRef(null)
  const latestValue = useRef(value)
  latestValue.current = value
  
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    
    setStatus('saving')
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        await onSave(latestValue.current)
        setStatus('saved')
      } catch (err) {
        console.error(err)
        setStatus('error')
      }
    }, delay)
    
    return () => clearTimeout(timer.current)
  }, [value])
  
  // Flush on unmount
  useEffect(() => () => {
    if (status === 'saving') {
      clearTimeout(timer.current)
      onSave(latestValue.current).catch(console.error)
    }
  }, [])
  
  return status
}
```

Usage in editor:
```javascript
const [title, setTitle] = useState(note.title)
const [content, setContent] = useState(note.content)
const saveStatus = useAutoSave({ title, content }, (v) => updateNote(note.id, v))

// In JSX: <SaveIndicator status={saveStatus} />
```

## Note Card Component

```javascript
// src/features/notes/components/NoteCard.jsx
import { Pin, Lock, Users } from 'lucide-react'
import { motion } from 'framer-motion'

export function NoteCard({ note, onClick }) {
  return (
    <motion.div
      layout
      layoutId={`note-${note.id}`}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="group relative p-4 rounded-lg border bg-card hover:shadow-md transition-shadow cursor-pointer break-inside-avoid mb-4"
      style={{ backgroundColor: note.color !== '#ffffff' ? note.color : undefined }}
    >
      <div className="absolute top-3 right-3 flex gap-1 text-muted-foreground">
        {note.is_pinned && <Pin className="h-3.5 w-3.5" />}
        {note.password_hash && <Lock className="h-3.5 w-3.5" />}
        {note.shared_count > 0 && <Users className="h-3.5 w-3.5" />}
      </div>
      
      {note.title && (
        <h3 className="font-semibold text-base mb-1.5 pr-16 line-clamp-2">
          {note.title}
        </h3>
      )}
      
      {note.password_hash ? (
        <p className="text-sm text-muted-foreground italic">This note is password protected</p>
      ) : (
        <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">
          {stripHtml(note.content)}
        </p>
      )}
      
      {note.labels?.length > 0 && (
        <div className="flex gap-1 mt-3 flex-wrap">
          {note.labels.slice(0, 3).map(l => (
            <span key={l.id} className="text-xs px-2 py-0.5 rounded-full" 
                  style={{ backgroundColor: l.color + '20', color: l.color }}>
              {l.name}
            </span>
          ))}
          {note.labels.length > 3 && (
            <span className="text-xs text-muted-foreground">+{note.labels.length - 3}</span>
          )}
        </div>
      )}
      
      <time className="text-xs text-muted-foreground mt-3 block">
        {formatRelative(note.updated_at)}
      </time>
    </motion.div>
  )
}
```

## Grid vs List View

Use CSS columns for masonry-like grid, or react-masonry-css:

```javascript
function NotesGrid({ notes, view }) {
  if (view === 'list') {
    return (
      <div className="max-w-3xl mx-auto space-y-2">
        {notes.map(n => <NoteListRow key={n.id} note={n} />)}
      </div>
    )
  }
  
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
      {notes.map(n => <NoteCard key={n.id} note={n} />)}
    </div>
  )
}
```

## Live Search Hook

```javascript
// src/hooks/useDebouncedValue.js
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}
```

```javascript
function SearchBar() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)
  
  const results = useLiveQuery(async () => {
    if (!debouncedQuery) return null
    return db.notes
      .filter(n => 
        n.title?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        n.content?.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
      .toArray()
  }, [debouncedQuery])
  
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search notes..."
        className="w-full pl-10 pr-4 h-10 rounded-md border bg-background"
      />
    </div>
  )
}
```

## Dialog Pattern (shadcn/ui)

```javascript
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete note?</DialogTitle>
      <DialogDescription>
        This action can't be undone. The note and its attachments will be permanently deleted.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button variant="destructive" onClick={handleDelete}>Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Toast Notifications

Use `sonner` (recommended) — cleaner API than react-hot-toast:

```javascript
import { toast } from 'sonner'
toast.success('Note saved')
toast.error('Failed to delete')
toast.info('New note shared with you', { action: { label: 'View', onClick: () => navigate(`/shared`) }})
```

## Responsive Strategy

- Mobile-first: default styles for mobile, `sm:`, `md:`, `lg:` for larger
- Sidebar: `<Sheet>` (drawer) on mobile, fixed panel on `lg:`
- New note: FAB (`fixed bottom-6 right-6`) on mobile, button in header on desktop
- Editor: full-screen on mobile, shares screen with list on desktop

```javascript
<div className="flex h-screen">
  <aside className="hidden lg:block w-60 border-r"><Sidebar /></aside>
  <Sheet><SheetContent side="left" className="lg:hidden"><Sidebar /></SheetContent></Sheet>
  <main className="flex-1 overflow-auto">...</main>
</div>
```

## Accessibility

- All form inputs have `<label>` (or `aria-label` for icon-only)
- Focus visible (Tailwind `focus-visible:ring-2`)
- Dialogs trap focus (shadcn handles this)
- Skip link at top: `<a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>`
- Loading states use `aria-busy` and screen-reader text
- Keyboard shortcuts documented in a `?` help dialog

## Common Pitfalls

- **Re-rendering the whole notes list on every keystroke**: memoize NoteCard, derive filtered list outside render
- **Stale closures in auto-save**: use refs for latest values
- **Forgetting layout animations**: wrap notes list in `<LayoutGroup>` for smooth reorder when pinning
- **TipTap losing focus on every content save**: don't reset the editor content externally — let it own its state, only sync ON LOAD
- **Dark mode flash**: apply theme class in `<head>` before React loads, using a small inline script reading localStorage
