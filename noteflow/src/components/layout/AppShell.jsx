import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { UnverifiedBanner } from './UnverifiedBanner'
import { OfflineBanner } from '@/components/feedback/OfflineBanner'
import { useAuth } from '@/hooks/useAuth'
import { usePreferencesStore } from '@/stores/preferencesStore'

export function AppShell() {
  const { user } = useAuth()
  const defaultView = usePreferencesStore(s => s.defaultView)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [view, setView] = useState(defaultView || 'grid')
  const [activeLabel, setActiveLabel] = useState(null)

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeLabel={activeLabel}
        setActiveLabel={setActiveLabel}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <OfflineBanner />
        <UnverifiedBanner user={user} />
        <Header
          search={search}
          setSearch={setSearch}
          view={view}
          setView={setView}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ search, view, activeLabel, setActiveLabel }} />
        </main>
      </div>

      {/* FAB — mobile only */}
      <button
        onClick={() => window.location.href = '/notes/new'}
        className="fixed bottom-6 right-6 sm:hidden w-14 h-14 rounded-full shadow-md flex items-center justify-center text-white z-30 transition-transform active:scale-95"
        style={{ backgroundColor: 'var(--accent)' }}
        aria-label="New note"
      >
        <span className="text-2xl leading-none">+</span>
      </button>
    </div>
  )
}
