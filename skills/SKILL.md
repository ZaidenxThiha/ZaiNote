# NoteFlow Project Skills — Master Index

This directory contains specialized guidance for building the NoteFlow note management app. When working on this project, consult the relevant skill file before writing code.

## How to use

**Always read the skill relevant to your current task before writing code.** These docs encode lessons learned from building similar apps and prevent common mistakes.

## Skills in this project

### SUPABASE.md
Read this when working with ANY Supabase feature: auth, queries, storage, realtime, edge functions. Covers client setup, RLS patterns, error handling, and pitfalls.

### OFFLINE_PWA.md  
Read this when implementing offline support, Dexie/IndexedDB caching, sync queues, or service workers. Covers write-through pattern, conflict resolution, and testing offline.

### REALTIME_COLLAB.md
Read this when implementing real-time multi-user note editing (criterion #24). Covers Yjs + Supabase Realtime integration, awareness protocol, and the custom SupabaseProvider.

### SECURITY.md
Read this when implementing auth flows, note password protection, password reset, or any cryptographic operations. Covers bcrypt usage, OTP, encryption patterns, and common leaks to avoid.

### FRONTEND.md
Read this when building React components, managing state, styling with Tailwind, or implementing UI interactions. Covers project structure, state patterns, auto-save hook, and responsive strategy.

## Reference docs (in ../docs/)

- **ARCHITECTURE.md** — high-level system design and data flow
- **DATABASE.md** — complete SQL migration and RLS policies
- **DESIGN_SYSTEM.md** — colors, typography, spacing, motion, components
- **DEPLOYMENT.md** — Supabase + Cloudflare Pages setup steps

## Priority order when stuck

1. Check relevant skill file in this directory
2. Check `../docs/` for architecture/design questions
3. Check Supabase docs: https://supabase.com/docs
4. Check shadcn/ui docs: https://ui.shadcn.com

## Non-negotiable rules (from project spec)

These are DISQUALIFYING if violated:

- ❌ Don't add features beyond the 28 rubric criteria
- ❌ Don't use separate screens for create vs. edit note (same interface)
- ❌ Don't require a save button (auto-save only)
- ❌ Don't delete without a confirmation dialog
- ❌ Don't block unverified users from features (show banner, allow access)
- ❌ Don't add a "Search" button (live search only)
- ❌ Don't cascade-delete notes when a label is deleted
- ❌ Don't store passwords in plaintext (always bcrypt)
- ❌ Don't hardcode URLs/ports — use relative paths and env vars
