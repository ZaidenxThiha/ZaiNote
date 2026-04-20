import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppShell } from '@/components/layout/AppShell'
import NotesPage from '@/pages/NotesPage'
import NoteEditorPage from '@/pages/NoteEditorPage'
import LoginPage from '@/features/auth/pages/LoginPage'
import RegisterPage from '@/features/auth/pages/RegisterPage'
import ResetPasswordPage from '@/features/auth/pages/ResetPasswordPage'
import AuthCallbackPage from '@/features/auth/pages/AuthCallbackPage'
import SharedNotesPage from '@/features/sharing/pages/SharedNotesPage'
import SettingsPage from '@/features/preferences/pages/SettingsPage'
import TrashPage from '@/pages/TrashPage'
import { useAuthStore } from '@/stores/authStore'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { supabase } from '@/lib/supabase'
import { setupOnlineListener } from '@/services/sync/syncManager'

function AuthGuard({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border-strong)', borderTopColor: 'var(--accent)' }} />
    </div>
  )
  if (!user) return <Navigate to="/auth/login" replace />
  return children
}

function GuestGuard({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { setSession, fetchProfile } = useAuthStore()
  const { applyAll, syncFromProfile } = usePreferencesStore()

  useEffect(() => {
    applyAll()
    setupOnlineListener()

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchProfile().then(() => {
          const profile = useAuthStore.getState().profile
          if (profile) syncFromProfile(profile)
        })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchProfile().then(() => {
          const profile = useAuthStore.getState().profile
          if (profile) syncFromProfile(profile)
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/login" element={<GuestGuard><LoginPage /></GuestGuard>} />
        <Route path="/auth/register" element={<GuestGuard><RegisterPage /></GuestGuard>} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        <Route path="/" element={<AuthGuard><AppShell /></AuthGuard>}>
          <Route index element={<NotesPage />} />
          <Route path="notes/:id" element={<NoteEditorPage />} />
          <Route path="shared" element={<SharedNotesPage />} />
          <Route path="trash" element={<TrashPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster position="top-right" richColors closeButton />
    </BrowserRouter>
  )
}
