import Dexie from 'dexie'

export const db = new Dexie('zainote')

db.version(1).stores({
  notes: 'id, user_id, updated_at, is_pinned, pinned_at',
  labels: 'id, user_id, name',
  note_labels: '[note_id+label_id], note_id, label_id',
  note_attachments: 'id, note_id',
  syncQueue: '++id, type, table, record_id, created_at',
})

db.version(2).stores({
  notes: 'id, user_id, updated_at, is_pinned, pinned_at, deleted_at',
  labels: 'id, user_id, name',
  note_labels: '[note_id+label_id], note_id, label_id',
  note_attachments: 'id, note_id',
  syncQueue: '++id, type, table, record_id, created_at',
})

db.version(3).stores({
  notes: 'id, user_id, updated_at, is_pinned, pinned_at, deleted_at, is_archived',
  labels: 'id, user_id, name',
  note_labels: '[note_id+label_id], note_id, label_id',
  note_attachments: 'id, note_id',
  syncQueue: '++id, type, table, record_id, created_at',
})
