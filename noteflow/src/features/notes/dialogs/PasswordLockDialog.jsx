import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordStrengthMeter } from '@/features/auth/components/PasswordStrengthMeter'
import { setNotePassword, removeNotePassword, updateNote, verifyNotePassword } from '../api'
import { toast } from 'sonner'

export function PasswordLockDialog({ note, open, onOpenChange, onSuccess }) {
  const mode = note?.password_hash ? 'manage' : 'enable'
  const [subMode, setSubMode] = useState(mode) // enable | disable | change
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [current, setCurrent] = useState('')
  const [loading, setLoading] = useState(false)

  const reset = () => { setPw(''); setConfirm(''); setCurrent(''); setSubMode(mode) }

  const handleEnable = async () => {
    if (pw !== confirm) { toast.error("Passwords don't match"); return }
    if (pw.length < 4) { toast.error('Password too short'); return }
    setLoading(true)
    await setNotePassword(note.id, pw)
    setLoading(false)
    toast.success('Note locked')
    onSuccess?.()
    onOpenChange(false)
    reset()
  }

  const handleDisable = async () => {
    const valid = await verifyNotePassword(note, current)
    if (!valid) { toast.error('Incorrect password'); return }
    setLoading(true)
    await removeNotePassword(note.id)
    setLoading(false)
    toast.success('Password removed')
    onSuccess?.()
    onOpenChange(false)
    reset()
  }

  const handleChange = async () => {
    const valid = await verifyNotePassword(note, current)
    if (!valid) { toast.error('Incorrect current password'); return }
    if (pw !== confirm) { toast.error("New passwords don't match"); return }
    setLoading(true)
    await setNotePassword(note.id, pw)
    setLoading(false)
    toast.success('Password updated')
    onSuccess?.()
    onOpenChange(false)
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset() }}>
      <DialogContent>
        {subMode === 'enable' && (
          <>
            <DialogHeader>
              <DialogTitle>Lock note</DialogTitle>
              <DialogDescription>Set a password to protect this note.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Password</Label>
                <Input type="password" placeholder="Enter password" className="mt-1" value={pw} onChange={e => setPw(e.target.value)} />
                <PasswordStrengthMeter password={pw} />
              </div>
              <div>
                <Label>Confirm password</Label>
                <Input type="password" placeholder="Confirm password" className="mt-1" value={confirm} onChange={e => setConfirm(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleEnable} disabled={loading || !pw || !confirm}>{loading ? 'Locking...' : 'Lock note'}</Button>
            </DialogFooter>
          </>
        )}

        {subMode === 'manage' && (
          <>
            <DialogHeader>
              <DialogTitle>Note password</DialogTitle>
              <DialogDescription>This note is password protected.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 mt-2">
              <Button variant="secondary" className="w-full" onClick={() => setSubMode('change')}>Change password</Button>
              <Button variant="danger" className="w-full" onClick={() => setSubMode('disable')}>Remove password</Button>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            </DialogFooter>
          </>
        )}

        {subMode === 'disable' && (
          <>
            <DialogHeader>
              <DialogTitle>Remove password</DialogTitle>
              <DialogDescription>Enter your current password to remove protection.</DialogDescription>
            </DialogHeader>
            <div className="mt-2">
              <Label>Current password</Label>
              <Input type="password" placeholder="Enter current password" className="mt-1" value={current} onChange={e => setCurrent(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setSubMode('manage')}>Back</Button>
              <Button variant="danger" onClick={handleDisable} disabled={loading || !current}>{loading ? 'Removing...' : 'Remove'}</Button>
            </DialogFooter>
          </>
        )}

        {subMode === 'change' && (
          <>
            <DialogHeader>
              <DialogTitle>Change password</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label>Current password</Label>
                <Input type="password" className="mt-1" value={current} onChange={e => setCurrent(e.target.value)} />
              </div>
              <div>
                <Label>New password</Label>
                <Input type="password" className="mt-1" value={pw} onChange={e => setPw(e.target.value)} />
                <PasswordStrengthMeter password={pw} />
              </div>
              <div>
                <Label>Confirm new password</Label>
                <Input type="password" className="mt-1" value={confirm} onChange={e => setConfirm(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setSubMode('manage')}>Back</Button>
              <Button onClick={handleChange} disabled={loading}>{loading ? 'Updating...' : 'Update'}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
