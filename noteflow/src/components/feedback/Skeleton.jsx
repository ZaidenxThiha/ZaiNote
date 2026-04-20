import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-md', className)}
      style={{ backgroundColor: 'var(--bg-tertiary)' }}
      {...props}
    />
  )
}

export function NoteCardSkeleton() {
  return (
    <div className="rounded-lg p-3 space-y-2" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <div className="flex gap-1 pt-1">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>
    </div>
  )
}
