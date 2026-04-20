import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AuthLayout } from '../components/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sendPasswordResetEmail, sendOtpReset, verifyOtp, updatePassword } from '../api'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('choose') // choose | link | otp | verify | newpw
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)

  const sendLink = async () => {
    setLoading(true)
    const { error } = await sendPasswordResetEmail(email)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Reset link sent! Check your inbox.')
    setMode('done-link')
  }

  const sendOtp = async () => {
    setLoading(true)
    const { error } = await sendOtpReset(email)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('OTP sent to your email.')
    setMode('verify')
  }

  const checkOtp = async () => {
    setLoading(true)
    const { valid } = await verifyOtp(email, otp)
    setLoading(false)
    if (!valid) { toast.error('Invalid or expired OTP'); return }
    setOtpVerified(true)
    setMode('newpw')
  }

  const setPassword = async () => {
    setLoading(true)
    const { error } = await updatePassword(newPassword)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Password updated!')
    navigate('/')
  }

  return (
    <AuthLayout title="Reset password" subtitle="We'll help you get back in">
      {mode === 'choose' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" placeholder="you@example.com" className="mt-1" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <Button className="w-full" onClick={() => setMode('select')} disabled={!email}>Continue</Button>
          <Link to="/auth/login" className="block text-center text-sm hover:underline" style={{ color: 'var(--accent)' }}>Back to login</Link>
        </div>
      )}

      {mode === 'select' && (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>How would you like to reset your password?</p>
          <Button className="w-full" onClick={() => { setMode('link'); sendLink() }} disabled={loading}>
            Send email link
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => { setMode('otp'); sendOtp() }} disabled={loading}>
            Send 6-digit OTP code
          </Button>
        </div>
      )}

      {mode === 'verify' && (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Enter the 6-digit code sent to {email}</p>
          <div>
            <Label htmlFor="otp">OTP Code</Label>
            <Input id="otp" placeholder="123456" maxLength={6} className="mt-1 text-center text-lg tracking-widest" value={otp} onChange={e => setOtp(e.target.value)} />
          </div>
          <Button className="w-full" onClick={checkOtp} disabled={loading || otp.length !== 6}>Verify code</Button>
        </div>
      )}

      {mode === 'newpw' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="newpw">New password</Label>
            <Input id="newpw" type="password" placeholder="Min. 8 characters" className="mt-1" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <Button className="w-full" onClick={setPassword} disabled={loading || newPassword.length < 8}>Update password</Button>
        </div>
      )}

      {mode === 'done-link' && (
        <div className="text-center space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Check your inbox for a reset link. It expires in 1 hour.</p>
          <Link to="/auth/login" className="btn-primary inline-flex">Back to login</Link>
        </div>
      )}
    </AuthLayout>
  )
}
