import { createElement } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { StickyNote, Pin, Share2, Settings, Tag, X, Trash2, Archive } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/offline/db'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

export function Sidebar({ open, onClose, activeLabel, setActiveLabel }) {
  const location = useLocation()
  const { user } = useAuth()

  const labels = useLiveQuery(
    () => user ? db.labels.where('user_id').equals(user.id).sortBy('name') : [],
    [user?.id],
    []
  )

  const noteCounts = useLiveQuery(async () => {
    const noteLabels = await db.note_labels.toArray()
    const notes = await db.notes.where('user_id').equals(user?.id || '').filter(n => !n.deleted_at && !n.is_archived).toArray()
    const activeNoteIds = new Set(notes.map(n => n.id))
    const counts = {}
    for (const nl of noteLabels) {
      if (activeNoteIds.has(nl.note_id)) {
        counts[nl.label_id] = (counts[nl.label_id] || 0) + 1
      }
    }
    return counts
  }, [user?.id], {})

  const nav = [
    { to: '/', label: 'All Notes', icon: StickyNote },
    { to: '/?filter=pinned', label: 'Pinned', icon: Pin },
    { to: '/shared', label: 'Shared with me', icon: Share2 },
    { to: '/archive', label: 'Archive', icon: Archive },
    { to: '/trash', label: 'Trash', icon: Trash2 },
  ]

  return (
    <>
      {open && <div className="fixed inset-0 z-30 lg:hidden" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={onClose} />}

      <aside className={cn(
        'fixed top-0 left-0 h-full z-40 w-64 flex flex-col transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:z-auto',
        open ? 'translate-x-0' : '-translate-x-full',
      )} style={{ backgroundColor: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between h-14 px-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <Link to="/" className="flex items-center gap-2" onClick={onClose}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
              <StickyNote className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>ZaiNote</span>
          </Link>
          <button className="lg:hidden p-1 rounded-md hover:bg-muted" onClick={onClose}>
            <X className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = location.pathname + location.search === to
            return (
              <Link
                key={to}
                to={to}
                onClick={() => { setActiveLabel && setActiveLabel(null); onClose() }}
                className={cn('flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors mb-0.5', active ? 'font-medium' : '')}
                style={active
                  ? { backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }
                  : { color: 'var(--text-secondary)' }
                }
              >
                {createElement(Icon, { className: 'h-4 w-4 shrink-0' })}
                {label}
              </Link>
            )
          })}

          {labels && labels.length > 0 && (
            <div className="mt-3 mb-1">
              <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Labels</p>
              {labels.map(label => (
                <button
                  key={label.id}
                  onClick={() => { setActiveLabel(activeLabel === label.id ? null : label.id); onClose() }}
                  className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors mb-0.5 text-left')}
                  style={activeLabel === label.id
                    ? { backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }
                    : { color: 'var(--text-secondary)' }
                  }
                >
                  <Tag className="h-4 w-4 shrink-0" />
                  <span className="truncate">{label.name}</span>
                  <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>{noteCounts[label.id] || ''}</span>
                </button>
              ))}
            </div>
          )}
        </nav>

        <div className="p-2" style={{ borderTop: '1px solid var(--border)' }}>
          <Link
            to="/settings"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </aside>
    </>
  )
}
