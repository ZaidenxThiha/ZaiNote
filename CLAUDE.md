# CLAUDE.md

> This file is automatically read by Claude Code when working in this project. It provides project-specific context.

## Project: NoteFlow

A note management web app built as a university final project (Web Programming & Applications, 503073). Must satisfy 28 specific grading criteria.

## Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS + shadcn/ui
- **State**: Zustand
- **Offline**: Dexie.js + vite-plugin-pwa
- **Editor**: TipTap + Yjs (for collab)
- **Backend**: Supabase (Auth, Postgres, Storage, Realtime)
- **Deployment**: Cloudflare Pages + Supabase Cloud

## Working on this project

1. **READ `skills/SKILL.md` FIRST** — it's the index to all specialized guidance
2. **Before writing any Supabase code** → read `skills/SUPABASE.md`
3. **Before writing offline/PWA code** → read `skills/OFFLINE_PWA.md`
4. **Before implementing collab** → read `skills/REALTIME_COLLAB.md`
5. **Before implementing any auth or password feature** → read `skills/SECURITY.md`
6. **Before writing React components** → read `skills/FRONTEND.md`
7. **For design questions** → read `docs/DESIGN_SYSTEM.md`

## Strict rules (disqualifying if violated)

- Same interface for creating AND editing notes (no separate "create note" modal)
- Only title + content fields on note create (no extra attributes)
- Auto-save only — no save button
- Confirmation dialog before every delete
- Unverified users can use all features (just show a banner)
- Live search only — no search button (300ms debounce)
- Deleting a label does NOT delete its notes
- Renaming a label updates display on all associated notes automatically
- Status icons (pin/lock/shared) visible in BOTH grid and list views

## Coding conventions

- Use functional React components with hooks (no classes)
- Prefer `useLiveQuery` from dexie-react-hooks for reactive data
- CSS: Tailwind utility classes only (no CSS modules or styled-components)
- Imports: absolute paths via `@/` alias (configured in vite.config.js)
- File names: PascalCase for components, camelCase for hooks/utils
- Types: JSDoc comments for complex props (optional JS project, could upgrade to TS later)

## State management

- **Server state**: Supabase queries, cached in Dexie, exposed via useLiveQuery
- **Auth state**: `src/stores/authStore.js` (Zustand)
- **Preferences**: `src/stores/preferencesStore.js` (Zustand, persisted)
- **Session state** (e.g. unlocked notes): `src/stores/unlockedNotesStore.js` (Zustand, NOT persisted — cleared on logout)
- **Form state**: component-local `useState` or react-hook-form for complex forms

## What NOT to add

Per the spec, do not invent features. If you think something would be "nice to have" but isn't in the 28 criteria, don't add it. The spec warns that extra features may cause the project to be rejected as not independently completed.

Stay within the spec. Make what's there excellent.
