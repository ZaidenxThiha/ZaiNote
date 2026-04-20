import { supabase } from '@/lib/supabase'

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  return { data, error }
}

export async function signUp({ email, password, displayName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  return { data, error }
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function sendPasswordResetEmail(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
  })
  return { data, error }
}

export async function sendOtpReset(email) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
  const { error } = await supabase.from('password_reset_otps').insert({
    email,
    otp_code: otp,
    expires_at: expiresAt,
  })
  if (error) return { error }
  // Trigger edge function to send OTP email
  await supabase.functions.invoke('send-share-email', {
    body: { type: 'otp', email, otp },
  })
  return { error: null }
}

export async function verifyOtp(email, otpCode) {
  const { data, error } = await supabase
    .from('password_reset_otps')
    .select('*')
    .eq('email', email)
    .eq('otp_code', otpCode)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .single()
  if (error || !data) return { valid: false }
  await supabase.from('password_reset_otps').update({ used: true }).eq('id', data.id)
  return { valid: true }
}

export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword })
  return { data, error }
}

export async function resendVerificationEmail() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: new Error('Not logged in') }
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: user.email,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  })
  return { error }
}
