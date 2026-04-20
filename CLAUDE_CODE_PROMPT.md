# 🤖 Claude Code Master Prompt

Copy this into Claude Code to bootstrap the entire project. Execute it in the empty project directory.

---

## 🎯 MASTER PROMPT

```
You are building a production-grade note management web app called "NoteFlow" for a university final project. It must satisfy 28 specific grading criteria covering authentication, note CRUD, labels, sharing, real-time collab, PWA offline support, and polished responsive UI.

## TECH STACK (strict — don't substitute)

- **Frontend**: React 18 + Vite, TailwindCSS, shadcn/ui components, Zustand for state, React Router v6, Framer Motion for animations, TipTap for rich text editor, Lucide React for icons, sonner for toasts
- **Offline**: Dexie.js (IndexedDB), dexie-react-hooks, vite-plugin-pwa (Workbox)
- **Collab**: Yjs, y-protocols, @tiptap/extension-collaboration, @tiptap/extension-collaboration-cursor
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions)
- **Deployment**: Cloudflare Pages (frontend), Supabase Cloud (backend), Resend (transactional email)
- **Password hashing for note locks**: bcryptjs (client-side)

## PROJECT STRUCTURE (create exactly this)

```
noteflow/
├── public/
│   ├── manifest.json
│   ├── favicon.ico
│   └── icons/ (192, 512, maskable)
├── supabase/
│   ├── migrations/
│   │   └── 0001_initial_schema.sql
│   └── functions/
│       └── send-share-email/index.ts
├── src/
│   ├── components/
│   │   ├── ui/ (shadcn: button, dialog, input, label, etc.)
│   │   ├── layout/ (AppShell, Sidebar, Header, UnverifiedBanner)
│   │   └── feedback/ (EmptyState, Skeleton, SaveIndicator, OfflineBanner)
│   ├── features/
│   │   ├── auth/
│   │   │   ├── pages/ (LoginPage, RegisterPage, ResetPasswordPage, AuthCallbackPage)
│   │   │   ├── components/ (AuthLayout, PasswordStrengthMeter)
│   │   │   └── api.js
│   │   ├── notes/
│   │   │   ├── components/ (NoteCard, NoteListRow, NotesGrid, NoteEditor, CollabEditor, NoteToolbar, ColorPicker, AttachmentUploader, ImageViewer)
│   │   │   ├── hooks/ (useNotes, useNote, useAutoSave)
│   │   │   ├── dialogs/ (DeleteNoteDialog, PasswordLockDialog, UnlockDialog)
│   │   │   └── api.js
│   │   ├── labels/
│   │   │   ├── components/ (LabelManager, LabelChip, LabelPicker, LabelFilter)
│   │   │   └── api.js
│   │   ├── sharing/
│   │   │   ├── components/ (ShareDialog, SharedNotesList, RecipientList, CollaboratorAvatars)
│   │   │   ├── pages/ (SharedNotesPage)
│   │   │   └── api.js
│   │   └── preferences/
│   │       ├── pages/ (SettingsPage)
│   │       └── components/ (ThemeToggle, FontSizeSelector, ProfileEditor)
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useOnlineStatus.js
│   │   ├── useDebouncedValue.js
│   │   └── useKeyboardShortcuts.js
│   ├── lib/
│   │   ├── supabase.js
│   │   └── utils.js (cn helper, formatters)
│   ├── pages/
│   │   ├── NotesPage.jsx
│   │   └── NoteEditorPage.jsx
│   ├── services/
│   │   ├── offline/
│   │   │   └── db.js (Dexie schema)
│   │   └── sync/
│   │       └── syncManager.js
│   ├── stores/
│   │   ├── authStore.js
│   │   ├── preferencesStore.js
│   │   └── unlockedNotesStore.js
│   ├── styles/
│   │   └── globals.css
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── .env.local (gitignored)
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
├── wrangler.toml (Cloudflare config)
└── README.md
```

## FEATURE REQUIREMENTS (all 28 must work)

### Authentication (criteria 1-8)

1. **Registration**: email + display name + password + confirm password. Passwords don't store plaintext — Supabase bcrypts. On success, auto-login and send activation email.
2. **Activation**: email contains link → clicking activates. Banner shown until verified (ALL features still work pre-verification).
3. **Login/logout**: standard email+password; session persists.
4. **Password reset**: offer BOTH options — "Email link" and "OTP code". OTP is 6 digits, 15-min expiry, stored in `password_reset_otps` table.
5. **View profile**: show display name, email, avatar on settings page.
6. **Edit profile**: change display name, upload/crop avatar (use `browser-image-compression`).
7. **Change password**: current + new + confirm new, via `supabase.auth.updateUser`.
8. **Preferences**: theme (light/dark/system), font size (small/medium/large), default note color, default view (grid/list). Persist in `profiles` table + Zustand.

### Simple Notes (criteria 9-20)

9. **List view**: single column of rows on all screens, sorted by pin+updated_at.
10. **Grid view**: masonry columns (1 mobile, 2 tablet, 3-4 desktop).
11. **Create**: click "+" → new note with generated UUID → navigate to editor. ONLY title and content fields exposed in the creation interface.
12. **Update**: **SAME INTERFACE** as create (don't build separate screens). Spec is strict on this.
13. **Delete**: opens a confirmation dialog BEFORE deleting. Cascade deletes attachments.
14. **Auto-save**: debounce 800ms on title+content changes, write to Dexie + queue sync. Indicator shows "Saving..." / "Saved".
15. **Image attachments**: multiple allowed, drag-drop or picker, compress client-side, upload to Supabase Storage, thumbnails in editor.
16. **Pin**: toggle on card/editor. Pinned notes sort first, ordered by most-recent pin. Use Framer Motion `layout` for smooth reorder.
17. **Search**: live, searches title AND content, debounce 300ms, NO search button. When offline, searches local Dexie.
18. **Label CRUD**: list, add, rename, delete labels from a dedicated manager UI accessible from sidebar.
19. **Attach labels**: multi-select picker inside note editor side panel.
20. **Filter by labels**: sidebar lists labels with counts; clicking a label filters notes to only those with that label. Multi-select OR semantics.

### Advanced Notes (criteria 21-24)

21. **Enable/disable password**: enable requires entering password TWICE (confirm). Disable requires re-entering current password.
22. **Change password**: current + new + confirm-new.
23. **Share**: email input with autocomplete showing registered users matching. On send, validate email exists (via `find_user_by_email` RPC), select permission (read/edit), multi-recipient support. Create `note_shares` row + `notifications` row + trigger Edge Function to email recipient. Recipient sees new notification badge on next login. Owner can see all recipients of a note (avatar, email, permission) and revoke/modify any of them.
24. **Real-time collab**: for notes shared with edit permission, use Yjs CRDT over Supabase Realtime broadcast channel. Show live cursors of other editors (CollaborationCursor extension). Persist Yjs state to `notes.yjs_state` (bytea) every 5s.

### Status Icons (implicit requirement)
Both list and grid views show recognizable icons on notes that are: pinned, password-protected, shared. Use Lucide icons (Pin, Lock, Users).

### Others (criteria 25-28)

25. **UI/UX**: polished, distinctive. Follow the Design System doc strictly. Avoid generic AI aesthetics (no purple-blue gradients everywhere, no rounded-2xl on everything). Use Inter font. Warm off-white light mode, deep-warm dark mode.
26. **Responsive**: mobile (< 768), tablet (768-1024), desktop (> 1024). Sidebar becomes drawer on mobile. New-note becomes FAB on mobile.
27. **Offline PWA**: service worker caches app shell; Dexie mirrors notes locally with `useLiveQuery`; edits offline queue to syncQueue and flush on reconnect; `navigator.onLine` triggers flush; installable (manifest.json).
28. **Online deployment**: ready to deploy to Cloudflare Pages (frontend) + Supabase Cloud (backend).

## IMPLEMENTATION ORDER

Build in this order to avoid dependency issues:

**Phase 1 — Foundation** (1-2 hrs)
1. Initialize Vite + React + Tailwind + shadcn/ui
2. Install all dependencies
3. Set up Supabase client, env vars
4. Apply database migration (paste SQL into Supabase dashboard OR use Supabase CLI)
5. Create Dexie schema
6. Set up routing with auth guards
7. Create globals.css with CSS variables for light/dark

**Phase 2 — Auth** (2-3 hrs) → criteria 1-4
8. Login page (matching design system)
9. Register page (with password confirm, email validation, display name)
10. AuthProvider + authStore
11. UnverifiedBanner component
12. Auth callback page (handles email verification redirect)
13. Password reset flow (both link and OTP)

**Phase 3 — Notes Core** (3-4 hrs) → criteria 9-14
14. AppShell layout with Sidebar + Header
15. Notes page with grid view
16. Note card component with all status icons
17. Note editor page with TipTap
18. Auto-save hook + indicator
19. Delete confirmation
20. List view toggle

**Phase 4 — Notes Advanced** (2-3 hrs) → criteria 15-20
21. Image attachment upload/display
22. Pin functionality with layout animations
23. Live search with debounce
24. Label manager (CRUD)
25. Label picker in editor
26. Label filter in sidebar

**Phase 5 — Profile & Prefs** (1-2 hrs) → criteria 5-8
27. Settings page with tabs (Profile, Preferences, Security)
28. Avatar upload with crop
29. Preferences persistence + theme application
30. Change password form

**Phase 6 — Password-Protected Notes** (1-2 hrs) → criteria 21-22
31. Password lock dialog (enable: double entry)
32. Unlock dialog
33. Change password on note
34. Disable password (require current)
35. Session-scoped unlockedNotes store

**Phase 7 — Sharing** (2-3 hrs) → criterion 23
36. find_user_by_email RPC (add to migration)
37. Share dialog with autocomplete
38. Recipient list management (modify/revoke)
39. Shared notes page for recipients
40. Notification system (in-app toast + bell badge)
41. send-share-email Edge Function + deployment

**Phase 8 — Realtime Collab** (2-3 hrs) → criterion 24
42. SupabaseProvider (Yjs wrapper)
43. CollabEditor component
44. Awareness / cursor display
45. Switch between CollabEditor (shared+edit) and SimpleEditor (private)

**Phase 9 — PWA Offline** (2 hrs) → criterion 27
46. vite-plugin-pwa config
47. manifest.json + icons
48. syncManager with exponential backoff
49. OnlineStatus hook + banner
50. useLiveQuery for reactive note lists

**Phase 10 — Polish & Responsive** (2-3 hrs) → criteria 25, 26
51. Full responsive audit (320px → 2560px)
52. Empty states, loading skeletons
53. Keyboard shortcuts (Cmd+K search, Cmd+N new note)
54. Accessibility pass (ARIA, focus rings, contrast)
55. Motion polish with Framer Motion
56. Final UI pass against design system

**Phase 11 — Deployment** (1 hr) → criterion 28
57. Build locally, fix any prod issues
58. Push to GitHub
59. Connect Cloudflare Pages
60. Set env vars in Cloudflare
61. Update Supabase redirect URLs with production domain
62. Test full flow on production URL

## CRITICAL RULES

1. **Use the SAME interface for creating AND editing notes** — spec says modifications are disqualifying. This means: no "create note" modal. Clicking "+" creates a blank note and opens the editor.
2. **Only title and content fields** when creating a note — no color, no labels, no pin on the initial create form. Those are editor actions after creation.
3. **No save button** for notes — auto-save only.
4. **Delete MUST show a confirmation dialog.**
5. **Account works before verification** — just show the banner.
6. **Live search** — no button.
7. **Deleting a label doesn't affect notes** — only remove `note_labels` rows.
8. **Renaming a label updates all notes automatically** — this is free since it's a foreign key relationship.
9. **Email validation on share** — must confirm recipient is a registered user before sharing.
10. **Don't invent features** — spec warns against it. Stay exactly within these 28 criteria.

## ENV VARS

Create `.env.example`:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_APP_URL=http://localhost:5173
```

`.gitignore` must include `.env.local`, `.env.production`, `node_modules`, `dist`.

## DESIGN HINTS

- Inter font via `@fontsource-variable/inter`
- Palette: warm off-white `#fafaf9` (bg), indigo `#6366f1` (accent), near-black `#1c1917` (text)
- Dark: `#0c0a09` bg, `#818cf8` accent
- Border radius: 8px default
- Shadows: subtle, `shadow-sm` hovering to `shadow-md`
- Motion: 150-200ms for hover, 300ms for layout, ease-out
- NEVER use: generic purple gradients, glassmorphism, rounded-2xl everywhere, emoji-laden UI

## TESTING CHECKLIST (self-verify before declaring done)

After building, manually test EVERY criterion from the list above. For each, confirm it works as spec'd, not just "works kinda". Then record a demo video (per submission requirements) showing each feature in sequence.

---

**Start by asking me to confirm:**
1. My Supabase project URL and anon key
2. Whether I've already run the migration SQL
3. Whether I have a Resend API key for transactional email (if not, you'll use Supabase's built-in SMTP for auth emails; share-email will need Resend or a fallback)

Then begin Phase 1. Report progress after each phase.
```

---

## How to use this prompt

1. **Create an empty project folder** on your machine
2. **Open Claude Code** in that folder (`claude` in terminal)
3. **Paste the entire block between `---` markers above** as your first message
4. Claude Code will ask you for Supabase credentials → create a Supabase project first (see `docs/DEPLOYMENT.md`)
5. As Claude Code builds, it'll reference the skills in this repo. Copy the `skills/` folder into your project as `.claude/skills/` so Claude Code can read them

### Tip: split into phases

The prompt above covers the whole project. For better results, after the foundation is set up, start a fresh Claude Code session per phase and paste only that phase's requirements + relevant skill files. This keeps context focused.

## Supplementary prompts

After the main prompt, use these for specific polish tasks:

### Polish prompt
```
Review the entire app against docs/DESIGN_SYSTEM.md. Identify and fix:
- Any components using generic AI aesthetics (overused gradients, rounded-2xl, glassmorphism)
- Inconsistent spacing or border radius
- Dark mode issues (low contrast, missing states)
- Missing loading/empty/error states
- Accessibility issues (focus rings, ARIA labels, contrast)
- Non-responsive layouts at 320px, 768px, 1024px, 1920px
Make concrete improvements, not just report issues.
```

### Pre-submission prompt
```
I need to submit this project. Help me:
1. Clean up the project (remove node_modules, build artifacts, .env files)
2. Verify all 28 rubric criteria work end-to-end — list any broken ones
3. Generate a readme.txt file at the project root with: tech stack, live URL, test credentials, build/run instructions, and list of optional features implemented
4. Fill out the Rubrik.docx self-assessment (I'll provide the file)
5. Create a deployment verification script I can run before the demo
```
