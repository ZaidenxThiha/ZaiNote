import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { AuthLayout } from '../components/AuthLayout'
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signUp, signInWithGoogle } from '../api'
import { useAuthStore } from '@/stores/authStore'

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

const schema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export default function RegisterPage() {
  const navigate = useNavigate()
  const fetchProfile = useAuthStore(s => s.fetchProfile)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { control, register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })
  const password = useWatch({ control, name: 'password', defaultValue: '' })

  const handleGoogle = async () => {
    setGoogleLoading(true)
    const { error } = await signInWithGoogle()
    if (error) { toast.error(error.message); setGoogleLoading(false) }
  }

  const onSubmit = async ({ email, password, displayName }) => {
    setLoading(true)
    const { error } = await signUp({ email, password, displayName })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Account created! Check your email to verify.')
    await fetchProfile()
    navigate('/')
  }

  return (
    <AuthLayout title="Create account" subtitle="Start managing your ZaiNote account">
      <div className="space-y-4">
        {/* Google button */}
        <button
          type="button"
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
          <Label htmlFor="displayName">Display name</Label>
          <Input id="displayName" placeholder="Your name" className="mt-1" {...register('displayName')} />
          {errors.displayName && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.displayName.message}</p>}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" className="mt-1" {...register('email')} />
          {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="Min. 8 characters" className="mt-1" {...register('password')} />
          <PasswordStrengthMeter password={password} />
          {errors.password && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.password.message}</p>}
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input id="confirmPassword" type="password" placeholder="••••••••" className="mt-1" {...register('confirmPassword')} />
          {errors.confirmPassword && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.confirmPassword.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
        <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/auth/login" className="font-medium hover:underline" style={{ color: 'var(--accent)' }}>Sign in</Link>
        </p>
      </form>
      </div>
    </AuthLayout>
  )
}
