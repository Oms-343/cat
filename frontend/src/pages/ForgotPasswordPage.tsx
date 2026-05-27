import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { forgotPasswordRequest, forgotPasswordReset } from '../api/auth'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { homePathForRole } from '../auth/homePath'
import {
  AuthBackLink,
  AuthError,
  AuthField,
  AuthLayout,
} from '../layouts/AuthLayout'
import { PasswordStrengthHints } from '../components/PasswordStrengthHints'
import { passwordIsStrong } from '../utils/passwordStrength'
import { Alert, Button, Input } from '../components/ui'

type Step = 'email' | 'otp' | 'password' | 'done'

export function ForgotPasswordPage() {
  const { user } = useAuth()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [demoOtp, setDemoOtp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to={homePathForRole(user.role)} replace />

  async function handleEmail(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await forgotPasswordRequest(email)
      setDemoOtp(res.demo_otp)
      setStep('otp')
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  function handleOtp(e: FormEvent) {
    e.preventDefault()
    if (otp.length < 4) {
      setError('Enter the 4-digit code.')
      return
    }
    setError(null)
    setStep('password')
  }

  async function handlePassword(e: FormEvent) {
    e.preventDefault()
    if (!passwordIsStrong(newPassword)) {
      setError('Password does not meet the requirements.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await forgotPasswordReset(email, otp, newPassword)
      setStep('done')
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'done') {
    return (
      <AuthLayout title="Password updated" subtitle="You can sign in with your new password.">
        <Alert variant="success" className="mb-4">
          Your password has been reset successfully.
        </Alert>
        <AuthBackLink>Go to sign in →</AuthBackLink>
      </AuthLayout>
    )
  }

  if (step === 'password') {
    return (
      <AuthLayout title="New password" subtitle="Choose a strong password.">
        <form onSubmit={handlePassword} className="space-y-4">
          <AuthField label="New password" htmlFor="new-password">
            <Input
              id="new-password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <PasswordStrengthHints password={newPassword} />
          </AuthField>
          {error && <AuthError message={error} />}
          <Button type="submit" fullWidth disabled={submitting}>
            {submitting ? 'Saving…' : 'Reset password'}
          </Button>
        </form>
        <AuthBackLink />
      </AuthLayout>
    )
  }

  if (step === 'otp') {
    return (
      <AuthLayout title="Enter code" subtitle="Check your email (demo code shown below).">
        <form onSubmit={handleOtp} className="space-y-4">
          {demoOtp && (
            <Alert variant="info">
              Demo OTP: <strong className="font-mono text-ink">{demoOtp}</strong>
            </Alert>
          )}
          <AuthField label="Verification code" htmlFor="otp">
            <Input
              id="otp"
              required
              maxLength={8}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="font-mono"
              placeholder="1234"
            />
          </AuthField>
          {error && <AuthError message={error} />}
          <Button type="submit" fullWidth>
            Continue
          </Button>
        </form>
        <AuthBackLink />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Forgot password" subtitle="We'll send a verification code (demo: 1234).">
      <form onSubmit={handleEmail} className="space-y-4">
        <AuthField label="Registered email" htmlFor="forgot-email">
          <Input
            id="forgot-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </AuthField>
        {error && <AuthError message={error} />}
        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? 'Sending…' : 'Send code'}
        </Button>
      </form>
      <p className="text-xs text-muted-soft mt-4">Use your TIDCO admin email e.g. admin@tidco.com</p>
      <AuthBackLink />
    </AuthLayout>
  )
}
