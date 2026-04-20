import { supabase } from '@/lib/supabase'

export async function findUserByEmail(email) {
  const { data, error } = await supabase.rpc('find_user_by_email', { search_email: email })
  if (error) throw error
  return data?.[0] ?? null
}

export async function shareNote(noteId, ownerId, recipientId, permission) {
  const { data, error } = await supabase.from('note_shares').upsert({
    note_id: noteId,
    owner_id: ownerId,
    recipient_id: recipientId,
    permission,
  }, { onConflict: 'note_id,recipient_id' }).select().single()
  if (error) throw error

  // Create notification
  await supabase.from('notifications').insert({
    user_id: recipientId,
    type: 'note_shared',
    title: 'Note shared with you',
    message: `A note was shared with you with ${permission} permission`,
    data: { note_id: noteId },
  })

  // Trigger edge function for email
  try {
    await supabase.functions.invoke('send-share-email', {
      body: { type: 'share', note_id: noteId, recipient_id: recipientId, permission },
    })
  } catch { /* optional email */ }

  return data
}

export async function updateSharePermission(shareId, permission) {
  const { error } = await supabase.from('note_shares').update({ permission }).eq('id', shareId)
  if (error) throw error
}

export async function revokeShare(shareId) {
  const { error } = await supabase.from('note_shares').delete().eq('id', shareId)
  if (error) throw error
}

export async function fetchNoteShares(noteId) {
  const { data, error } = await supabase
    .from('note_shares')
    .select('*, profiles!recipient_id(id, email, display_name, avatar_url)')
    .eq('note_id', noteId)
  if (error) throw error
  return data ?? []
}

export async function fetchNotifications(userId) {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  return data ?? []
}

export async function markNotificationRead(id) {
  await supabase.from('notifications').update({ is_read: true }).eq('id', id)
}

export async function markAllNotificationsRead(userId) {
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
}
