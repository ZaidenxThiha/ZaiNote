import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const usePreferencesStore = create(
  persist(
    (set, get) => ({
      theme: 'system',
      fontSize: 'medium',
      defaultNoteColor: '#ffffff',
      defaultView: 'grid',

      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },
      setFontSize: (fontSize) => {
        set({ fontSize })
        applyFontSize(fontSize)
      },
      setDefaultNoteColor: (color) => set({ defaultNoteColor: color }),
      setDefaultView: (view) => set({ defaultView: view }),

      applyAll: () => {
        const { theme, fontSize } = get()
        applyTheme(theme)
        applyFontSize(fontSize)
      },

      syncFromProfile: (profile) => {
        if (!profile) return
        set({
          theme: profile.theme || 'system',
          fontSize: profile.font_size || 'medium',
          defaultNoteColor: profile.default_note_color || '#ffffff',
          defaultView: profile.default_view || 'grid',
        })
        applyTheme(profile.theme || 'system')
        applyFontSize(profile.font_size || 'medium')
      },
    }),
    { name: 'noteflow-prefs' }
  )
)

function applyTheme(theme) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else if (theme === 'light') {
    root.classList.remove('dark')
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  }
}

function applyFontSize(size) {
  document.body.classList.remove('font-size-small', 'font-size-medium', 'font-size-large')
  document.body.classList.add(`font-size-${size}`)
}
