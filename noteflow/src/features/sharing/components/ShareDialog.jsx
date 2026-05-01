import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { findUserByEmail, shareNote, fetchNoteShares, updateSharePermission, revokeShare } from '../api'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

export function ShareDialog({ note, open, onOpenChange }) {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [foundUser, setFoundUser] = useState(null)
  const [permission, setPermission] = useState('read')
  const [shares, setShares] = useState([])
  const [searching, setSearching] = useState(false)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    if (open && note) fetchNoteShares(note.id).then(setShares)
  }, [open, note])

  const searchUser = async () => {
    if (!email) return
    setSearching(true)
    try {
      const u = await findUserByEmail(email)
      if (u) setFoundUser(u)
      else toast.error('No user found with that email')
    } catch {
      toast.error('Search failed')
    } finally {
      setSearching(false)
    }
  }

  const handleShare = async () => {
    if (!foundUser) return
    setSharing(true)
    try {
      await shareNote(note.id, user.id, foundUser.id, permission)
      const updated = await fetchNoteShares(note.id)
      setShares(updated)
      setEmail('')
      setFoundUser(null)
      toast.success(`Note shared with ${foundUser.email}`)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSharing(false)
    }
  }

  const handleRevoke = async (shareId) => {
    await revokeShare(shareId)
    setShares(s => s.filter(share => share.id !== shareId))
    toast.success('Access revoked')
  }

  const handleUpdatePermission = async (shareId, perm) => {
    await updateSharePermission(shareId, perm)
    setShares(s => s.map(share => share.id === shareId ? { ...share, permission: perm } : share))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Share note</DialogTitle>
          <DialogDescription>Share "{note?.title || 'Untitled'}" with others</DialogDescription>
        </DialogHeader>

        {/* Search input */}
        <div className="flex gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            <Input
              value={email}
              onChange={e => { setEmail(e.target.value); setFoundUser(null) }}
              placeholder="Enter email address"
              className="pl-9"
              onKeyDown={e => e.key === 'Enter' && searchUser()}
            />
          </div>
          <Button variant="secondary" onClick={searchUser} disabled={searching || !email}>
            {searching ? '...' : 'Find'}
          </Button>
        </div>

        {/* Found user */}
        {foundUser && (
          <div className="flex items-center gap-3 p-3 rounded-lg mt-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <Avatar className="h-8 w-8">
              {foundUser.avatar_url && <AvatarImage src={foundUser.avatar_url} />}
              <AvatarFallback>{foundUser.display_name?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{foundUser.display_name}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{foundUser.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={permission}
                onChange={e => setPermission(e.target.value)}
                className="text-sm border rounded px-2 py-1 outline-none"
                style={{ borderColor: 'var(--border-strong)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                <option value="read">Can view</option>
                <option value="edit">Can edit</option>
              </select>
              <Button size="sm" onClick={handleShare} disabled={sharing}>
                {sharing ? '...' : 'Share'}
              </Button>
            </div>
          </div>
        )}

        {/* Current shares */}
        {shares.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>SHARED WITH</p>
            <div className="space-y-2">
              {shares.map(share => (
                <div key={share.id} className="flex items-center gap-3 p-2 rounded-lg" style={{ border: '1px solid var(--border)' }}>
                  <Avatar className="h-7 w-7">
                    {share.profiles?.avatar_url && <AvatarImage src={share.profiles.avatar_url} />}
                    <AvatarFallback className="text-xs">{share.profiles?.display_name?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{share.profiles?.display_name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{share.profiles?.email}</p>
                  </div>
                  <select
                    value={share.permission}
                    onChange={e => handleUpdatePermission(share.id, e.target.value)}
                    className="text-xs border rounded px-1 py-0.5 outline-none"
                    style={{ borderColor: 'var(--border-strong)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  >
                    <option value="read">Can view</option>
                    <option value="edit">Can edit</option>
                  </select>
                  <button onClick={() => handleRevoke(share.id)} className="p-1 hover:opacity-70">
                    <X className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
