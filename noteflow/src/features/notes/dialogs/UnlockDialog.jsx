import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { verifyNotePassword } from '../api'
import { useUnlockedNotesStore } from '@/stores/unlockedNotesStore'
import { toast } from 'sonner'

export function UnlockDialog({ note, open, onOpenChange }) {
  const [pw, setPw] = useState('')
  const [loading, setLoading] = useState(false)
  const unlock = useUnlockedNotesStore(s => s.unlock)

  const handleUnlock = async () => {
    setLoading(true)
    const valid = await verifyNotePassword(note, pw)
    setLoading(false)
    if (!valid) { toast.error('Incorrect password'); return }
    unlock(note.id)
    onOpenChange(false)
    setPw('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unlock note</DialogTitle>
          <DialogDescription>Enter the password to access this note.</DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          <Label>Password</Label>
          <Input
            type="password"
            placeholder="Enter password"
            className="mt-1"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleUnlock()}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleUnlock} disabled={loading || !pw}>{loading ? 'Checking...' : 'Unlock'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
