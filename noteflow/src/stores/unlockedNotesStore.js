import { create } from 'zustand'

export const useUnlockedNotesStore = create((set, get) => ({
  unlockedNotes: new Set(),

  unlock: (noteId) => {
    const s = new Set(get().unlockedNotes)
    s.add(noteId)
    set({ unlockedNotes: s })
  },

  lock: (noteId) => {
    const s = new Set(get().unlockedNotes)
    s.delete(noteId)
    set({ unlockedNotes: s })
  },

  isUnlocked: (noteId) => get().unlockedNotes.has(noteId),

  clearAll: () => set({ unlockedNotes: new Set() }),
}))
