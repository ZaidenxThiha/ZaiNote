import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { AuthLayout } from '../components/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signIn, signInWithGoogle } from '../api'
import { useAuthStore } from '@/stores/authStore'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
})

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const fetchProfile = useAuthStore(s => s.fetchProfile)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async ({ email, password }) => {
    setLoading(true)
    const { error } = await signIn({ email, password })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    await fetchProfile()
    navigate('/')
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    const { error } = await signInWithGoogle()
    if (error) { toast.error(error.message); setGoogleLoading(false) }
    // On success, Supabase redirects to /auth/callback automatically
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your ZaiNote account">
      <div className="space-y-4">
        {/* Google button */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium border transition-colors hover:bg-muted disabled:opacity-60"
          style={{ borderColor: 'var(--border-strong)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)' }}
        >
          <GoogleIcon />
          {googleLoading ? 'Redirecting...' : 'Continue with Google'}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or</span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" className="mt-1" {...register('email')} />
            {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.email.message}</p>}
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link to="/auth/reset-password" className="text-xs hover:underline" style={{ color: 'var(--accent)' }}>Forgot password?</Link>
            </div>
            <Input id="password" type="password" placeholder="••••••••" className="mt-1" {...register('password')} />
            {errors.password && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/auth/register" className="font-medium hover:underline" style={{ color: 'var(--accent)' }}>Sign up</Link>
        </p>
      </div>
    </AuthLayout>
  )
}
