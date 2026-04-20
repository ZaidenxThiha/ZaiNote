import { db } from '@/services/offline/db'
import { supabase } from '@/lib/supabase'

let syncing = false

export async function syncPendingChanges() {
  if (syncing) return
  syncing = true
  try {
    const queue = await db.syncQueue.orderBy('created_at').toArray()
    for (const item of queue) {
      await processSyncItem(item)
      await db.syncQueue.delete(item.id)
    }
  } catch (e) {
    console.error('Sync error:', e)
  } finally {
    syncing = false
  }
}

async function processSyncItem(item) {
  const { type, table, data } = item
  if (type === 'upsert') {
    await supabase.from(table).upsert(data)
  } else if (type === 'delete') {
    await supabase.from(table).delete().eq('id', data.id)
  }
}

export async function queueSync(type, table, data) {
  await db.syncQueue.add({ type, table, data, created_at: new Date().toISOString() })
}

export function setupOnlineListener() {
  window.addEventListener('online', () => {
    syncPendingChanges()
  })
}
