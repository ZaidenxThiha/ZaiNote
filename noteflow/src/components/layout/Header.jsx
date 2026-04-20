import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Search, Grid2x2, List, Plus, X, Bell, LogOut, Settings, User } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

export function Header({ search, setSearch, view, setView, onMenuClick }) {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)

  const initials = profile?.display_name?.slice(0, 2).toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'

  return (
    <header className="sticky top-0 z-20 h-14 flex items-center gap-3 px-4" style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
      {/* Menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-md hover:bg-muted"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
      </button>

      {/* Search bar — center */}
      <div className={cn(
        'flex-1 mx-auto max-w-xl transition-all',
        searchOpen ? 'flex' : 'hidden sm:flex'
      )}>
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none transition-all"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1 ml-auto">
        <button className="sm:hidden p-2 rounded-md" onClick={() => setSearchOpen(!searchOpen)}>
          <Search className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
        </button>

        {/* View toggle */}
        <div className="hidden sm:flex items-center rounded-md" style={{ border: '1px solid var(--border)' }}>
          <button
            onClick={() => setView('grid')}
            className={cn('p-2 rounded-l-md transition-colors', view === 'grid' ? '' : 'hover:bg-muted')}
            style={view === 'grid' ? { backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' } : { color: 'var(--text-secondary)' }}
            title="Grid view"
          >
            <Grid2x2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={cn('p-2 rounded-r-md transition-colors', view === 'list' ? '' : 'hover:bg-muted')}
            style={view === 'list' ? { backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' } : { color: 'var(--text-secondary)' }}
            title="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>

        {/* New note button — desktop */}
        <button
          onClick={() => navigate('/notes/new')}
          className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <Plus className="h-4 w-4" />
          New note
        </button>

        {/* Avatar / Profile dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="rounded-full focus:outline-none focus-visible:ring-2 ml-1" style={{ '--tw-ring-color': 'var(--accent)' }}>
              <Avatar className="h-8 w-8">
                {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.display_name} />}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-48 rounded-lg p-1 shadow-md"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
              align="end"
              sideOffset={8}
            >
              <div className="px-3 py-2 border-b mb-1" style={{ borderColor: 'var(--border)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{profile?.display_name || 'User'}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
              </div>
              <DropdownMenu.Item
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer outline-none hover:bg-muted"
                style={{ color: 'var(--text-secondary)' }}
                onSelect={() => navigate('/settings')}
              >
                <Settings className="h-4 w-4" />Settings
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer outline-none"
                style={{ color: 'var(--danger)' }}
                onSelect={signOut}
              >
                <LogOut className="h-4 w-4" />Sign out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  )
}
