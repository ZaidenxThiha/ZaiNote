import { supabase } from '@/lib/supabase'
import { db } from '@/services/offline/db'
import { queueSync } from '@/services/sync/syncManager'
import bcrypt from 'bcryptjs'

function sanitizeStorageFilename(fileName) {
  const normalized = fileName.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  const sanitized = normalized
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return sanitized || 'attachment'
}

export async function fetchNotes(userId) {
  const { data, error } = await supabase
    .from('notes')
    .select('*, note_labels(label_id), note_attachments(*)')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .eq('is_archived', false)
    .order('is_pinned', { ascending: false })
    .order('pinned_at', { ascending: false })
    .order('updated_at', { ascending: false })
  if (error) throw error
  if (data) await db.notes.bulkPut(data)
  return data
}

export async function fetchTrashedNotes(userId) {
  const { data, error } = await supabase
    .from('notes')
    .select('*, note_labels(label_id), note_attachments(*)')
    .eq('user_id', userId)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
  if (error) throw error
  if (data) await db.notes.bulkPut(data)
  return data
}

export async function fetchSharedNotes(userId) {
  const { data, error } = await supabase
    .from('note_shares')
    .select('*, notes(*, note_labels(label_id), note_attachments(*))')
    .eq('recipient_id', userId)
  if (error) throw error
  return data?.map(s => ({ ...s.notes, permission: s.permission, shareId: s.id })) ?? []
}

export async function createNote(userId, defaults = {}) {
  const note = {
    user_id: userId,
    title: '',
    content: '',
    color: defaults.color || '#ffffff',
    is_pinned: false,
  }
  const { data, error } = await supabase.from('notes').insert(note).select().single()
  if (error) throw error
  await db.notes.put(data)
  return data
}

export async function updateNote(id, updates) {
  const { data, error } = await supabase.from('notes').update(updates).eq('id', id).select().single()
  if (error) {
    const local = await db.notes.get(id)
    if (local) {
      await db.notes.put({ ...local, ...updates })
      await queueSync('upsert', 'notes', { id, ...updates })
    }
    return { id, ...updates }
  }
  await db.notes.put(data)
  return data
}

export async function trashNote(id) {
  const now = new Date().toISOString()
  const { data, error } = await supabase.from('notes').update({ deleted_at: now }).eq('id', id).select().single()
  if (error) {
    await queueSync('upsert', 'notes', { id, deleted_at: now })
  }
  const local = await db.notes.get(id)
  if (local) await db.notes.put({ ...local, deleted_at: now })
  return data || { id, deleted_at: now }
}

export async function restoreNote(id) {
  const { data, error } = await supabase.from('notes').update({ deleted_at: null }).eq('id', id).select().single()
  if (error) {
    await queueSync('upsert', 'notes', { id, deleted_at: null })
  }
  const local = await db.notes.get(id)
  if (local) await db.notes.put({ ...local, deleted_at: null })
  return data || { id, deleted_at: null }
}

export async function permanentDeleteNote(id) {
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) await queueSync('delete', 'notes', { id })
  await db.notes.delete(id)
}

export async function deleteNote(id) {
  return trashNote(id)
}

export async function togglePin(note) {
  return updateNote(note.id, { is_pinned: !note.is_pinned })
}

export async function duplicateNote(note) {
  const { data, error } = await supabase.from('notes').insert({
    user_id: note.user_id,
    title: note.title ? `${note.title} (Copy)` : '',
    content: note.content || '',
    color: note.color || '#ffffff',
    is_pinned: false,
  }).select().single()
  if (error) throw error
  await db.notes.put(data)
  return data
}

export async function archiveNote(id) {
  const { data, error } = await supabase.from('notes').update({ is_archived: true }).eq('id', id).select().single()
  if (error) await queueSync('upsert', 'notes', { id, is_archived: true })
  const local = await db.notes.get(id)
  if (local) await db.notes.put({ ...local, is_archived: true })
  return data || { id, is_archived: true }
}

export async function unarchiveNote(id) {
  const { data, error } = await supabase.from('notes').update({ is_archived: false }).eq('id', id).select().single()
  if (error) await queueSync('upsert', 'notes', { id, is_archived: false })
  const local = await db.notes.get(id)
  if (local) await db.notes.put({ ...local, is_archived: false })
  return data || { id, is_archived: false }
}

export async function fetchArchivedNotes(userId) {
  const { data, error } = await supabase
    .from('notes')
    .select('*, note_labels(label_id), note_attachments(*)')
    .eq('user_id', userId)
    .eq('is_archived', true)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
  if (error) throw error
  if (data) await db.notes.bulkPut(data)
  return data
}

export async function setNotePassword(noteId, password) {
  const hash = await bcrypt.hash(password, 10)
  return updateNote(noteId, { password_hash: hash })
}

export async function verifyNotePassword(note, password) {
  if (!note.password_hash) return true
  return bcrypt.compare(password, note.password_hash)
}

export async function removeNotePassword(noteId) {
  return updateNote(noteId, { password_hash: null })
}

export async function uploadAttachment(noteId, userId, file) {
  const safeFileName = sanitizeStorageFilename(file.name)
  const path = `${userId}/${noteId}/${Date.now()}-${safeFileName}`
  const { error: uploadError } = await supabase.storage.from('note-attachments').upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  })
  if (uploadError) throw uploadError
  const { data, error } = await supabase.from('note_attachments').insert({
    note_id: noteId,
    storage_path: path,
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type,
  }).select().single()
  if (error) throw error
  return data
}

export async function deleteAttachment(attachment) {
  await supabase.storage.from('note-attachments').remove([attachment.storage_path])
  await supabase.from('note_attachments').delete().eq('id', attachment.id)
}

export function getAttachmentUrl(path) {
  const { data } = supabase.storage.from('note-attachments').createSignedUrl(path, 3600)
  return data?.signedUrl
}
