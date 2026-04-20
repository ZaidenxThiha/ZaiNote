# 📝 NoteFlow - Note Management Application

> Final Project for 503073 - Web Programming & Applications (Semester II/2024-2025)

A modern, full-featured note management application built with React, Supabase, and deployed on Cloudflare Pages. Features real-time collaboration, offline PWA support, password-protected notes, and seamless sharing.

## 🎯 Tech Stack

### Frontend
- **React 18** with Vite
- **TailwindCSS** + **shadcn/ui** for polished UI
- **Zustand** for state management
- **React Router v6** for navigation
- **TipTap** for rich text editing
- **Dexie.js** (IndexedDB) for offline storage
- **Workbox** for PWA/Service Worker
- **Yjs + y-websocket** for real-time collaboration

### Backend (Supabase)
- **PostgreSQL** database
- **Supabase Auth** (email/password + email verification)
- **Supabase Storage** for images/file attachments
- **Supabase Realtime** for collaboration
- **Row Level Security (RLS)** for data protection
- **Edge Functions** for email sending & password reset

### Deployment
- **Cloudflare Pages** for frontend hosting
- **Supabase Cloud** for backend
- **Resend** or **Supabase SMTP** for emails

## ✨ Features (28 Criteria)

### Account Management (2.0 pts)
1. ✅ User registration with email/display name/password
2. ✅ Account activation via email link
3. ✅ Login/logout with JWT
4. ✅ Password reset (email link + OTP)
5. ✅ View profile and avatar
6. ✅ Edit profile and avatar
7. ✅ Change password
8. ✅ User preferences (theme, font size, note colors)

### Simple Note Management (4.0 pts)
9. ✅ Notes list view
10. ✅ Notes grid view
11. ✅ Create notes (title + content only)
12. ✅ Update notes (same interface as create)
13. ✅ Delete notes (with confirmation dialog)
14. ✅ Auto-save (debounced, no save button)
15. ✅ Image attachments
16. ✅ Pin notes to top
17. ✅ Live search (300ms debounce, title + content)
18. ✅ Label CRUD
19. ✅ Attach labels to notes
20. ✅ Filter by labels

### Advanced Note Management (2.0 pts)
21. ✅ Enable/disable password on notes (double entry, re-enter to disable)
22. ✅ Change password on notes (current + new + confirm)
23. ✅ Share notes (email validation + notification + permissions)
24. ✅ Real-time collaboration via WebSocket (Yjs)

### Other Requirements (2.0 pts)
25. ✅ Polished UI/UX with accessibility
26. ✅ Responsive (mobile, tablet, desktop)
27. ✅ Offline PWA with sync
28. ✅ Online deployment (Cloudflare + Supabase)

## 🚀 Quick Start

See `docs/DEPLOYMENT.md` for full setup instructions.

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Fill in your Supabase credentials

# Run locally
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare Pages
npm run deploy
```

## 📁 Project Structure

```
noteflow/
├── src/
│   ├── components/       # Reusable UI components
│   ├── features/          # Feature-specific modules
│   │   ├── auth/
│   │   ├── notes/
│   │   ├── labels/
│   │   ├── sharing/
│   │   └── preferences/
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities (supabase client, etc.)
│   ├── pages/             # Route pages
│   ├── stores/            # Zustand stores
│   ├── services/          # API & business logic
│   │   ├── supabase/
│   │   ├── offline/       # Dexie/IndexedDB
│   │   └── sync/          # Offline sync logic
│   ├── styles/
│   └── App.jsx
├── public/
│   ├── manifest.json      # PWA manifest
│   └── icons/
├── supabase/
│   ├── migrations/        # SQL migrations
│   └── functions/         # Edge functions
├── docs/
└── package.json
```
