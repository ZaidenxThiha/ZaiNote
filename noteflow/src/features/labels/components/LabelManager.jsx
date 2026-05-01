import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { db } from '@/services/offline/db'
import { createLabel, updateLabel, deleteLabel } from '../api'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function LabelManager() {
  const { user } = useAuth()
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')

  const labels = useLiveQuery(
    () => user ? db.labels.where('user_id').equals(user.id).sortBy('name') : [],
    [user?.id],
    []
  )

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    try {
      await createLabel(user.id, newName.trim())
      setNewName('')
      toast.success('Label created')
    } catch (e) {
      toast.error(e.message)
    }
  }

  const handleUpdate = async (id) => {
    if (!editName.trim()) return
    await updateLabel(id, { name: editName.trim() })
    setEditId(null)
    toast.success('Label renamed')
  }

  const handleDelete = async (id) => {
    await deleteLabel(id)
    toast.success('Label deleted')
  }

  return (
    <div className="space-y-3">
      {/* New label form */}
      <form onSubmit={handleCreate} className="flex gap-2">
        <Input
          placeholder="New label name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={!newName.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      {/* Label list */}
      <div className="space-y-1">
        {labels?.map(label => (
          <div key={label.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md group" style={{ border: '1px solid var(--border)' }}>
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: label.color || 'var(--accent)' }} />

            {editId === label.id ? (
              <input
                className="flex-1 text-sm bg-transparent outline-none"
                style={{ color: 'var(--text-primary)' }}
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleUpdate(label.id); if (e.key === 'Escape') setEditId(null) }}
                autoFocus
              />
            ) : (
              <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>{label.name}</span>
            )}

            {editId === label.id ? (
              <div className="flex gap-1">
                <button onClick={() => handleUpdate(label.id)} className="p-1 hover:text-success">
                  <Check className="h-3.5 w-3.5" style={{ color: 'var(--success)' }} />
                </button>
                <button onClick={() => setEditId(null)} className="p-1">
                  <X className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
            ) : (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditId(label.id); setEditName(label.name) }} className="p-1">
                  <Pencil className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
                </button>
                <button onClick={() => handleDelete(label.id)} className="p-1">
                  <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--danger)' }} />
                </button>
              </div>
            )}
          </div>
        ))}
        {labels?.length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No labels yet</p>
        )}
      </div>
    </div>
  )
}
