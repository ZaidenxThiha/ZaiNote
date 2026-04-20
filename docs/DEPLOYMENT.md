# 🚀 Deployment Guide — Cloudflare Pages + Supabase

## Part 1: Supabase Setup

### 1.1 Create Project

1. Go to https://supabase.com → New Project
2. Pick a region close to Vietnam (e.g., Singapore `ap-southeast-1`)
3. Save the DB password in a password manager
4. Wait ~2 min for provisioning

### 1.2 Get API Keys

Settings → API:
- `Project URL` → copy as `VITE_SUPABASE_URL`
- `anon public key` → copy as `VITE_SUPABASE_ANON_KEY`
- `service_role` key → **keep server-side only**, use for Edge Functions

### 1.3 Run Migrations

Option A (SQL Editor — fastest):
1. Open SQL Editor → New Query
2. Paste contents of `supabase/migrations/0001_initial_schema.sql`
3. Run

Option B (Supabase CLI — proper):
```bash
npm i -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

### 1.4 Configure Auth

Authentication → Providers → Email:
- ✅ Enable email provider
- ✅ Confirm email (activates the activation link feature)
- Site URL: `https://your-app.pages.dev` (or custom domain)
- Redirect URLs (add all): 
  - `https://your-app.pages.dev/auth/callback`
  - `https://your-app.pages.dev/auth/reset-password`
  - `http://localhost:5173/auth/callback` (dev)
  - `http://localhost:5173/auth/reset-password` (dev)

Authentication → Email Templates:
- Customize "Confirm signup" — branded
- Customize "Reset password" — include `{{ .Token }}` for OTP + link

### 1.5 Enable Realtime

Database → Replication:
- Turn on realtime for `notes` table (for collab)
- Turn on realtime for `notifications` table (for share alerts)

### 1.6 Create Storage Buckets

Storage:
- `note-attachments` (private) — max file size 10MB
- `avatars` (public) — max file size 2MB

### 1.7 Deploy Edge Functions

```bash
# In project root
supabase functions new send-share-email
# paste code from supabase/functions/send-share-email/index.ts

supabase functions deploy send-share-email
supabase secrets set RESEND_API_KEY=re_your_key_here
```

Example `send-share-email/index.ts`:
```typescript
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

serve(async (req) => {
  const { recipientEmail, noteTitle, senderName, permission } = await req.json()
  
  const resend = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'NoteFlow <noreply@yourdomain.com>',
      to: recipientEmail,
      subject: `${senderName} shared a note with you`,
      html: `<h2>${senderName} shared "${noteTitle}" with you</h2>
             <p>Permission: ${permission}</p>
             <a href="${Deno.env.get('APP_URL')}/shared">Open in NoteFlow</a>`
    })
  })
  
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

## Part 2: Resend (Transactional Email)

1. Sign up at https://resend.com (free tier: 100 emails/day, 3,000/month)
2. Add a domain, verify DNS records (or use `onboarding@resend.dev` for testing)
3. Create API key → store as Supabase secret

**Alternative**: use Supabase's built-in SMTP (limited to auth emails) + custom SMTP for share emails.

## Part 3: Cloudflare Pages Deployment

### 3.1 Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/noteflow.git
git push -u origin main
```

### 3.2 Connect to Cloudflare Pages

1. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git
2. Authorize GitHub, select repo
3. Build settings:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (or `frontend/` if monorepo)
   - **Node version**: 20 (set via `NODE_VERSION` env var)

### 3.3 Environment Variables

Add in Pages project → Settings → Environment variables:

**Production & Preview**:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_APP_URL=https://your-app.pages.dev
NODE_VERSION=20
```

### 3.4 Deploy

Push to `main` → Cloudflare auto-builds and deploys in ~90s.

Check live URL: `https://noteflow-xxx.pages.dev`

### 3.5 Custom Domain (Optional)

Pages → Custom domains → Set up → follow CNAME instructions.

### 3.6 Update Supabase Auth URLs

Once you have the final URL, go back to Supabase → Authentication → URL Configuration and update the Site URL and Redirect URLs to use your Cloudflare URL.

## Part 4: PWA Configuration

### 4.1 manifest.json (public/manifest.json)

```json
{
  "name": "NoteFlow",
  "short_name": "NoteFlow",
  "description": "Modern note management app",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#fafaf9",
  "theme_color": "#6366f1",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### 4.2 Service Worker (via vite-plugin-pwa)

`vite.config.js`:
```javascript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: { /* see above */ },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: { maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 5,
            }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
        ]
      }
    })
  ]
})
```

## Part 5: Verification Checklist

After deployment, verify:

- [ ] Site loads at Cloudflare URL
- [ ] Can register new account → receive verification email
- [ ] Click verification link → redirects correctly
- [ ] Can create, edit, delete notes
- [ ] Auto-save works (watch indicator)
- [ ] Upload image attachment
- [ ] Pin/unpin notes
- [ ] Create labels, assign to notes, filter
- [ ] Live search works with 300ms debounce
- [ ] Password-protect a note → verify lock dialog
- [ ] Share note with second account → receive email + notification
- [ ] Open two tabs, edit shared note → see real-time updates
- [ ] Go offline (DevTools Network tab) → still navigable
- [ ] Edit offline → reconnect → changes sync
- [ ] Install as PWA (Chrome address bar)
- [ ] Responsive on mobile (DevTools device emulation)
- [ ] Dark mode toggle works
- [ ] Password reset flow end-to-end

## Part 6: Troubleshooting

**"Invalid login" on known-good credentials**
→ Check Site URL matches deployment URL in Supabase Auth settings

**Emails not arriving**  
→ Check Resend dashboard logs, verify domain DNS, check spam folder

**Images 404 after upload**  
→ Verify storage bucket policies, check uploaded path matches `{userId}/...`

**Realtime not connecting**  
→ Confirm table has replication enabled, check browser console for WS errors

**Build fails on Cloudflare**  
→ Set `NODE_VERSION=20` env var, check `npm ci` succeeds locally

## Part 7: Cost Estimate (Free Tier)

| Service | Free Tier | Your Usage |
|---------|-----------|------------|
| Supabase | 500MB DB, 1GB storage, 2GB bandwidth, 50K MAUs | ✅ Plenty for demo |
| Cloudflare Pages | Unlimited bandwidth, 500 builds/month | ✅ Way under |
| Resend | 3,000 emails/month | ✅ More than enough |

**Total: $0/month** for grading & demo traffic.
