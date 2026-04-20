import { supabase } from '@/lib/supabase'
import { db } from '@/services/offline/db'

export async function fetchLabels(userId) {
  const { data, error } = await supabase.from('labels').select('*').eq('user_id', userId).order('name')
  if (error) throw error
  if (data) await db.labels.bulkPut(data)
  return data
}

export async function createLabel(userId, name, color = '#6366f1') {
  const { data, error } = await supabase.from('labels').insert({ user_id: userId, name, color }).select().single()
  if (error) throw error
  await db.labels.put(data)
  return data
}

export async function updateLabel(id, updates) {
  const { data, error } = await supabase.from('labels').update(updates).eq('id', id).select().single()
  if (error) throw error
  await db.labels.put(data)
  return data
}

export async function deleteLabel(id) {
  const { error } = await supabase.from('labels').delete().eq('id', id)
  if (error) throw error
  await db.labels.delete(id)
  // note_labels cascade on the server; clean local
  await db.note_labels.where('label_id').equals(id).delete()
}

export async function addLabelToNote(noteId, labelId) {
  const { error } = await supabase.from('note_labels').insert({ note_id: noteId, label_id: labelId })
  if (error && error.code !== '23505') throw error // ignore duplicate
  await db.note_labels.put({ note_id: noteId, label_id: labelId })
}

export async function removeLabelFromNote(noteId, labelId) {
  await supabase.from('note_labels').delete().eq('note_id', noteId).eq('label_id', labelId)
  await db.note_labels.where('[note_id+label_id]').equals([noteId, labelId]).delete()
}

export async function fetchNoteLabels(noteId) {
  const { data } = await supabase.from('note_labels').select('label_id').eq('note_id', noteId)
  return data?.map(r => r.label_id) ?? []
}
