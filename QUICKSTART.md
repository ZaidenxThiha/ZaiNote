# ⚡ Quick Start Checklist

Follow this sequence to get from zero to a deployed, graded app.

## Step 1: Create Supabase Project (15 min)

- [ ] Sign up at https://supabase.com
- [ ] Create a new project, region = Singapore (closest to Vietnam)
- [ ] Save the DB password
- [ ] From Settings → API, copy:
  - `Project URL` 
  - `anon public` key
  - `service_role` key (keep secret!)
- [ ] SQL Editor → paste full contents of `docs/DATABASE.md` migration SQL → Run
- [ ] Authentication → URL Configuration → set Site URL to `http://localhost:5173` for now
- [ ] Authentication → Email Templates → customize "Confirm signup" and "Reset password"
- [ ] Database → Replication → enable realtime for `notes` and `notifications` tables
- [ ] Storage → create buckets `note-attachments` (private) and `avatars` (public)

## Step 2: Create Resend Account (5 min — optional)

- [ ] Sign up at https://resend.com
- [ ] Generate API key, save securely
- [ ] If skipping for now, Supabase's built-in SMTP handles auth emails only; share emails can be implemented later

## Step 3: Initialize Project with Claude Code (2-3 hrs)

- [ ] Create empty folder: `mkdir noteflow && cd noteflow`
- [ ] Copy this entire project folder into `noteflow/` as reference docs
  - `docs/` → stays as reference
  - `skills/` → rename/copy to `.claude/skills/` so Claude Code can read
  - `CLAUDE.md` → keep at project root
  - `CLAUDE_CODE_PROMPT.md` → read from here, then paste into Claude Code
- [ ] Open Claude Code in this folder: `claude`
- [ ] Paste the master prompt from `CLAUDE_CODE_PROMPT.md`
- [ ] Provide your Supabase credentials when asked
- [ ] Let Claude Code work through Phase 1

## Step 4: Build Phase by Phase (10-15 hrs total)

Work through phases in `CLAUDE_CODE_PROMPT.md`. After each phase:

- [ ] Manually test the features from that phase against the rubric
- [ ] Commit to git: `git commit -m "Phase N: ..."`
- [ ] Note any bugs to fix before the next phase

## Step 5: Deploy (30 min)

- [ ] Push repo to GitHub (private is fine)
- [ ] Cloudflare Dashboard → Pages → Create → Connect to Git
- [ ] Framework preset: Vite, Build cmd: `npm run build`, Output: `dist`
- [ ] Add env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_APP_URL, NODE_VERSION=20)
- [ ] Deploy. Get your `.pages.dev` URL.
- [ ] Go back to Supabase → Auth → URL Configuration → update Site URL and add redirect URLs for the production URL
- [ ] Test registration end-to-end on production

## Step 6: Verify All 28 Criteria (1-2 hrs)

Go through `docs/RUBRIC_CHECKLIST.md` (create during verification), test each:

**Account (8)**
- [ ] 1. Register with email/name/password/confirm
- [ ] 2. Receive activation email, click link, banner disappears
- [ ] 3. Login and logout
- [ ] 4. Password reset via BOTH link and OTP
- [ ] 5. View profile with avatar
- [ ] 6. Edit profile + upload new avatar
- [ ] 7. Change password with current+new+confirm
- [ ] 8. Preferences: theme, font size, note color

**Simple Notes (12)**
- [ ] 9. List view
- [ ] 10. Grid view
- [ ] 11. Create note (title+content only, same UI as edit)
- [ ] 12. Update note (same UI)
- [ ] 13. Delete with confirmation
- [ ] 14. Auto-save with indicator
- [ ] 15. Upload images to notes
- [ ] 16. Pin notes (pinned ordered by pin time)
- [ ] 17. Live search (300ms, title+content)
- [ ] 18. Label CRUD
- [ ] 19. Attach labels to notes
- [ ] 20. Filter notes by labels

**Advanced Notes (4)**
- [ ] 21. Enable password (double-entry) + disable (re-enter current)
- [ ] 22. Change note password (current+new+confirm)
- [ ] 23. Share with email validation + notification + permissions + modify/revoke
- [ ] 24. Real-time collab on edit-shared notes (live cursors)

**Other (4)**
- [ ] 25. Polished UI/UX (compared to Notion/Linear)
- [ ] 26. Responsive on mobile/tablet/desktop
- [ ] 27. Offline access + sync
- [ ] 28. Deployed online

## Step 7: Record Demo Video

- [ ] 1080p minimum, clear audio
- [ ] All team members appear
- [ ] Briefly cover tech stack and architecture
- [ ] Demonstrate EVERY 28 criterion in order (match rubric numbering)
- [ ] Save as `demo.mp4` OR upload to YouTube and include link
- [ ] If file large, compress with HandBrake

## Step 8: Submission Package

Organize like:
```
id1_fullname1_id2_fullname2/
├── Rubrik.docx (filled out with self-assessment + URL + credentials)
├── source/
│   ├── (all source code, no node_modules, no build artifacts)
│   └── README.txt (build/run/deploy instructions + test account credentials)
└── demo.mp4 (or link file with YouTube URL)
```

Zip the folder: `id1_fullname1_id2_fullname2.zip`

- [ ] Remove `node_modules/`, `dist/`, `.env*` files before zipping
- [ ] Double-check README.txt has live URL + test login
- [ ] Upload to e-learning system (NOT email)

## Step 9: Final Checks Before Grading

- [ ] Visit live URL from an incognito window — still working?
- [ ] Can you login with the credentials you provided?
- [ ] Are pre-seeded test notes visible?
- [ ] Does the app work on a phone?
- [ ] Is the video clearly showing all features?

## Common Gotchas to Avoid

- ❌ Submitting with `node_modules` → -0.5 points deduction
- ❌ Missing test account credentials → -1.0 points
- ❌ Complex setup without docs → -2.0 points
- ❌ Site down during grading → lose all "online deployment" points
- ❌ Video missing a criterion → that criterion is "not implemented" regardless of code
- ❌ Late submission → -1 point per day

## Emergency Fallback: Docker Compose

If Cloudflare deployment fails at the last minute, package with docker-compose:

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports: ["5173:5173"]
    environment:
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
```

Include in submission + instructions. You still keep the 0.5 deployment points if instructor can run locally.

## Total Estimated Time

- Setup & planning: 2-3 hrs
- Coding with Claude Code: 10-15 hrs
- Testing & debugging: 3-5 hrs
- Deployment: 1 hr
- Video recording: 2 hrs
- Polish & submission: 2 hrs

**Total: 20-30 hours** — budget accordingly.
