import { supabase } from '@/lib/supabase'
import { db } from '@/services/offline/db'
import { queueSync } from '@/services/sync/syncManager'
import bcrypt from 'bcryptjs'

export async function fetchNotes(userId) {
  const { data, error } = await supabase
    .from('notes')
    .select('*, note_labels(label_id), note_attachments(*)')
    .eq('user_id', userId)
    .order('is_pinned', { ascending: false })
    .order('pinned_at', { ascending: false })
    .order('updated_at', { ascending: false })
  if (error) throw error
  // cache in Dexie
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
    // Offline — queue sync
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

export async function deleteNote(id) {
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) await queueSync('delete', 'notes', { id })
  await db.notes.delete(id)
}

export async function togglePin(note) {
  return updateNote(note.id, { is_pinned: !note.is_pinned })
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
  const path = `${userId}/${noteId}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage.from('note-attachments').upload(path, file)
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
