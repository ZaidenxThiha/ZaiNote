import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { supabase } from '@/lib/supabase'
import { NOTE_COLORS } from '@/lib/utils'
import { toast } from 'sonner'
import { updatePassword } from '@/features/auth/api'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, profile, setProfile, fetchProfile } = useAuth()
  const prefs = usePreferencesStore()

  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [changingPw, setChangingPw] = useState(false)
  const fileRef = useRef()

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    const { error } = await supabase.from('profiles').update({ display_name: displayName }).eq('id', user.id)
    setSavingProfile(false)
    if (error) { toast.error(error.message); return }
    await fetchProfile()
    toast.success('Profile updated')
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 400 })
    const path = `${user.id}/avatar-${Date.now()}`
    const { error } = await supabase.storage.from('avatars').upload(path, compressed, { upsert: true })
    if (error) { toast.error(error.message); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
    await fetchProfile()
    toast.success('Avatar updated')
  }

  const handleChangePassword = async () => {
    if (newPw !== confirmPw) { toast.error("Passwords don't match"); return }
    if (newPw.length < 8) { toast.error('Password too short'); return }
    setChangingPw(true)
    const { error } = await updatePassword(newPw)
    setChangingPw(false)
    if (error) { toast.error(error.message); return }
    toast.success('Password changed')
    setCurrentPw(''); setNewPw(''); setConfirmPw('')
  }

  const handlePrefsSave = async () => {
    await supabase.from('profiles').update({
      theme: prefs.theme,
      font_size: prefs.fontSize,
      default_note_color: prefs.defaultNoteColor,
      default_view: prefs.defaultView,
    }).eq('id', user.id)
    toast.success('Preferences saved')
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-md hover:bg-muted">
          <ArrowLeft className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
        </button>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Profile tab */}
        <TabsContent value="profile" className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16">
                {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                <AvatarFallback className="text-xl">{profile?.display_name?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <Camera className="h-3 w-3 text-white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{profile?.display_name}</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
            </div>
          </div>

          <div>
            <Label>Display name</Label>
            <Input className="mt-1" value={displayName} onChange={e => setDisplayName(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input className="mt-1" value={user?.email} disabled />
          </div>
          <Button onClick={handleSaveProfile} disabled={savingProfile}>
            {savingProfile ? 'Saving...' : 'Save profile'}
          </Button>
        </TabsContent>

        {/* Preferences tab */}
        <TabsContent value="preferences" className="space-y-6">
          <div>
            <Label className="block mb-2">Theme</Label>
            <div className="flex gap-2">
              {['light', 'dark', 'system'].map(t => (
                <button
                  key={t}
                  onClick={() => prefs.setTheme(t)}
                  className="px-4 py-2 rounded-md text-sm border capitalize transition-colors"
                  style={prefs.theme === t
                    ? { backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', borderColor: 'var(--accent)', color: 'var(--accent)' }
                    : { borderColor: 'var(--border-strong)', color: 'var(--text-secondary)' }
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="block mb-2">Font size</Label>
            <div className="flex gap-2">
              {['small', 'medium', 'large'].map(s => (
                <button
                  key={s}
                  onClick={() => prefs.setFontSize(s)}
                  className="px-4 py-2 rounded-md text-sm border capitalize transition-colors"
                  style={prefs.fontSize === s
                    ? { backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', borderColor: 'var(--accent)', color: 'var(--accent)' }
                    : { borderColor: 'var(--border-strong)', color: 'var(--text-secondary)' }
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="block mb-2">Default note color</Label>
            <div className="flex flex-wrap gap-2">
              {NOTE_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => prefs.setDefaultNoteColor(c.value)}
                  className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{ backgroundColor: c.value, borderColor: prefs.defaultNoteColor === c.value ? 'var(--accent)' : 'var(--border-strong)' }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div>
            <Label className="block mb-2">Default view</Label>
            <div className="flex gap-2">
              {['grid', 'list'].map(v => (
                <button
                  key={v}
                  onClick={() => prefs.setDefaultView(v)}
                  className="px-4 py-2 rounded-md text-sm border capitalize transition-colors"
                  style={prefs.defaultView === v
                    ? { backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', borderColor: 'var(--accent)', color: 'var(--accent)' }
                    : { borderColor: 'var(--border-strong)', color: 'var(--text-secondary)' }
                  }
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handlePrefsSave}>Save preferences</Button>
        </TabsContent>

        {/* Security tab */}
        <TabsContent value="security" className="space-y-4">
          <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>Change password</h3>
          <div>
            <Label>New password</Label>
            <Input type="password" className="mt-1" value={newPw} onChange={e => setNewPw(e.target.value)} />
          </div>
          <div>
            <Label>Confirm new password</Label>
            <Input type="password" className="mt-1" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
          </div>
          <Button onClick={handleChangePassword} disabled={changingPw || !newPw}>
            {changingPw ? 'Updating...' : 'Update password'}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  )
}
