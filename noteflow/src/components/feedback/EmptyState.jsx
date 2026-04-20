import { StickyNote } from 'lucide-react'

export function EmptyState({ title = 'No notes yet', description = 'Create your first note to get started', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        <StickyNote className="h-8 w-8" style={{ color: 'var(--text-muted)' }} />
      </div>
      <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{description}</p>
      {action}
    </div>
  )
}
