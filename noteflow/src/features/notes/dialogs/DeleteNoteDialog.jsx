import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { trashNote } from '../api'
import { toast } from 'sonner'

export function DeleteNoteDialog({ note, open, onOpenChange, onDeleted }) {
  const [loading, setLoading] = useState(false)

  const handleTrash = async () => {
    setLoading(true)
    try {
      await trashNote(note.id)
      toast.success('Note moved to trash')
      onDeleted?.()
      onOpenChange(false)
    } catch {
      toast.error('Failed to move note to trash')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move to Trash?</DialogTitle>
          <DialogDescription>
            "{note?.title || 'Untitled'}" will be moved to Trash. You can restore it later.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleTrash} disabled={loading}>
            {loading ? 'Moving...' : 'Move to Trash'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
