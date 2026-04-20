import { useState } from 'react'
import { MailCheck, X } from 'lucide-react'
import { toast } from 'sonner'
import { resendVerificationEmail } from '@/features/auth/api'

export function UnverifiedBanner({ user }) {
  const [dismissed, setDismissed] = useState(false)
  const [sending, setSending] = useState(false)

  if (!user || user.email_confirmed_at || dismissed) return null

  const resend = async () => {
    setSending(true)
    const { error } = await resendVerificationEmail()
    setSending(false)
    if (error) toast.error(error.message)
    else toast.success('Verification email resent!')
  }

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2 text-sm" style={{ backgroundColor: '#fef3c7', color: '#92400e', borderBottom: '1px solid #fde68a' }}>
      <div className="flex items-center gap-2">
        <MailCheck className="h-4 w-4 shrink-0" />
        <span>Please verify your email address.</span>
        <button onClick={resend} disabled={sending} className="font-medium underline hover:no-underline">
          {sending ? 'Sending...' : 'Resend verification email'}
        </button>
      </div>
      <button onClick={() => setDismissed(true)} className="shrink-0 hover:opacity-70">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
