import { CheckCircle2, Loader2 } from 'lucide-react'

export function SaveIndicator({ status }) {
  if (status === 'saving') {
    return (
      <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }} aria-live="polite">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving...
      </span>
    )
  }
  if (status === 'saved') {
    return (
      <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--success)' }} aria-live="polite">
        <CheckCircle2 className="h-3 w-3" />
        Saved
      </span>
    )
  }
  return null
}
