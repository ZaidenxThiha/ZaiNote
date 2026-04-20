# Security & Password Protection Skill

Use this skill when implementing authentication flows, note password protection, password reset, or any cryptographic operations.

## Note Password Protection

Per spec (criterion #21, #22), note-level password protection requires:

**Enable**: password + confirm password (double entry)  
**Change**: current password + new password + confirm new password  
**Disable**: re-enter current password  
**Unlock**: enter password before viewing/editing/deleting

### Implementation

Use bcrypt via a lightweight library since we're client-side. Install:

```bash
npm i bcryptjs
```

```javascript
// src/features/notes/notePassword.js
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'

export async function setNotePassword(noteId, password, confirmPassword) {
  if (password !== confirmPassword) {
    throw new Error("Passwords don't match")
  }
  if (password.length < 4) {
    throw new Error("Password must be at least 4 characters")
  }
  
  const hash = await bcrypt.hash(password, 10)
  
  const { error } = await supabase
    .from('notes')
    .update({ password_hash: hash })
    .eq('id', noteId)
  
  if (error) throw error
}

export async function verifyNotePassword(noteId, password) {
  const { data, error } = await supabase
    .from('notes')
    .select('password_hash')
    .eq('id', noteId)
    .single()
  
  if (error || !data.password_hash) return false
  return bcrypt.compare(password, data.password_hash)
}

export async function changeNotePassword(noteId, currentPassword, newPassword, confirmNewPassword) {
  const valid = await verifyNotePassword(noteId, currentPassword)
  if (!valid) throw new Error("Current password is incorrect")
  
  if (newPassword !== confirmNewPassword) {
    throw new Error("New passwords don't match")
  }
  
  const hash = await bcrypt.hash(newPassword, 10)
  const { error } = await supabase
    .from('notes')
    .update({ password_hash: hash })
    .eq('id', noteId)
  
  if (error) throw error
}

export async function disableNotePassword(noteId, currentPassword) {
  const valid = await verifyNotePassword(noteId, currentPassword)
  if (!valid) throw new Error("Current password is incorrect")
  
  const { error } = await supabase
    .from('notes')
    .update({ password_hash: null })
    .eq('id', noteId)
  
  if (error) throw error
}
```

### Unlock State Management

Use a session-scoped store so unlocked notes don't need re-entry every action within the session:

```javascript
// src/stores/unlockedNotes.js
import { create } from 'zustand'

export const useUnlockedNotes = create((set, get) => ({
  unlocked: new Set(),
  unlock: (noteId) => set(state => ({ unlocked: new Set([...state.unlocked, noteId]) })),
  lock: (noteId) => set(state => {
    const next = new Set(state.unlocked)
    next.delete(noteId)
    return { unlocked: next }
  }),
  isUnlocked: (noteId) => get().unlocked.has(noteId),
  clearAll: () => set({ unlocked: new Set() })
}))
```

Clear on logout. Auto-lock after N minutes of inactivity (optional polish).

### UI Flow

```javascript
function NoteView({ note }) {
  const isUnlocked = useUnlockedNotes(s => s.isUnlocked(note.id))
  const hasPassword = !!note.password_hash
  
  if (hasPassword && !isUnlocked) {
    return <UnlockDialog noteId={note.id} />
  }
  
  return <NoteEditor note={note} />
}
```

### Dialog Variants

- `<SetPasswordDialog>`: two password fields + confirm button (disabled until match)
- `<ChangePasswordDialog>`: current + new + confirm new
- `<DisablePasswordDialog>`: single current password input + warning text
- `<UnlockDialog>`: single password input, blocks view until correct

Each dialog shows inline errors (not toast) for password validation failures.

## Optional: Client-Side Content Encryption

For stronger protection (beyond UX gate), encrypt content with AES-GCM using PBKDF2-derived key:

```javascript
async function deriveKey(password, salt) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

async function encryptContent(content, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(password, salt)
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(content)
  )
  
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv))
  }
}
```

This is optional and adds complexity around indexing/search. For the grading requirement, bcrypt UX gate is sufficient. Mention the *option* in your demo for extra credit.

## Password Reset Flow

Spec requires BOTH methods: link OR OTP.

### Method 1: Link (Supabase built-in)

```javascript
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/auth/reset-password`
})
```

User clicks link → redirected with `?code=...` → handler:
```javascript
// On /auth/reset-password page
const { data } = await supabase.auth.exchangeCodeForSession(code)
// Now authenticated as the user, show new password form
await supabase.auth.updateUser({ password: newPassword })
```

### Method 2: OTP

Custom flow using the `password_reset_otps` table + Edge Function:

```typescript
// Edge function: request-otp
const otp = Math.floor(100000 + Math.random() * 900000).toString()
const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

await supabase.from('password_reset_otps').insert({
  email, otp_code: otp, expires_at: expiresAt
})

await sendEmail(email, `Your code: ${otp}`)
```

```javascript
// Client: verify OTP
const { data } = await supabase
  .from('password_reset_otps')
  .select()
  .eq('email', email)
  .eq('otp_code', enteredOtp)
  .eq('used', false)
  .gt('expires_at', new Date().toISOString())
  .maybeSingle()

if (data) {
  // Mark as used
  await supabase.from('password_reset_otps')
    .update({ used: true }).eq('id', data.id)
  
  // Proceed to new password form (requires admin action to reset password without session)
  // Call another edge function with service_role to update the password
}
```

### UI: offer both methods

Present two tabs on password reset screen: "Email link" and "Enter code". User picks preference.

## Email Verification Banner

Per spec, all features work before email verification, but a prominent banner should indicate unverified status.

```javascript
function UnverifiedBanner() {
  const { user } = useAuth()
  const [resending, setResending] = useState(false)
  
  if (user?.email_confirmed_at) return null
  
  const resend = async () => {
    setResending(true)
    await supabase.auth.resend({ type: 'signup', email: user.email })
    toast.success('Verification email sent')
    setResending(false)
  }
  
  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm">
        <AlertCircle className="h-4 w-4" />
        <span>Your email isn't verified yet. Check your inbox to activate your account.</span>
      </div>
      <Button variant="ghost" size="sm" onClick={resend} disabled={resending}>
        {resending ? 'Sending...' : 'Resend email'}
      </Button>
    </div>
  )
}
```

## Input Validation Rules

- **Email**: RFC 5322 regex + DNS sanity check (optional)
- **Password** (account): min 8 chars, require mixed case + number
- **Note password**: min 4 chars (lower bar, not protecting the same thing)
- **Display name**: 1-50 chars, trim whitespace

Show live validation as user types, not after submit.

## Security Checklist for Demo

- [ ] All passwords hashed (bcrypt for accounts via Supabase, bcrypt.js for note passwords)
- [ ] RLS enabled on every table
- [ ] No service_role key in client code
- [ ] `find_user_by_email` RPC doesn't leak user data
- [ ] All forms have CSRF protection (N/A — bearer tokens)
- [ ] XSS prevented (TipTap sanitizes; add DOMPurify if rendering external HTML)
- [ ] File uploads validated (size, MIME type)
- [ ] Password reset tokens single-use and time-limited
- [ ] Session expires on logout (clear Dexie + unlocked notes)
- [ ] Rate limiting on search (client debounce) + auth (Supabase built-in)

## Common Pitfalls

- **bcrypt in browser is slow**: use `bcryptjs` (pure JS), not `bcrypt` (native). Cost factor 10 takes ~300ms — acceptable for occasional use.
- **Leaking that email exists**: always show "If an account with that email exists, we've sent a reset link" — even if it doesn't. Prevents enumeration.
- **Storing note content after disabling password**: if you encrypted content with password, remember to DECRYPT and save plaintext before nulling the hash.
- **Forgetting to clear unlockedNotes on logout**: next user inherits previous user's unlock state. Always `clearAll()` on sign-out.
