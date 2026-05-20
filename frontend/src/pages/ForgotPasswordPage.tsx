import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { forgotPasswordRequest, forgotPasswordReset } from '../api/auth'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import {
  AuthBackLink,
  AuthError,
  AuthField,
  AuthLayout,
  authBtnPrimary,
  authInputCls,
} from '../components/AuthLayout'
import { PasswordStrengthHints } from '../components/PasswordStrengthHints'
import { passwordIsStrong } from '../utils/passwordStrength'

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

  if (user) return <Navigate to="/dashboard" replace />

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
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-4 mb-4">
          Your password has been reset successfully.
        </p>
        <AuthBackLink>Go to sign in →</AuthBackLink>
      </AuthLayout>
    )
  }

  if (step === 'password') {
    return (
      <AuthLayout title="New password" subtitle="Choose a strong password.">
        <form onSubmit={handlePassword} className="space-y-4">
          <AuthField label="New password">
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={authInputCls}
            />
            <PasswordStrengthHints password={newPassword} />
          </AuthField>
          {error && <AuthError message={error} />}
          <button type="submit" disabled={submitting} className={authBtnPrimary}>
            {submitting ? 'Saving…' : 'Reset password'}
          </button>
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
            <p className="text-xs text-blue-800 bg-blue-50 border border-blue-200 rounded-md p-2">
              Demo OTP: <strong className="font-mono">{demoOtp}</strong>
            </p>
          )}
          <AuthField label="Verification code">
            <input
              required
              maxLength={8}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className={authInputCls + ' font-mono'}
              placeholder="1234"
            />
          </AuthField>
          {error && <AuthError message={error} />}
          <button type="submit" className={authBtnPrimary}>
            Continue
          </button>
        </form>
        <AuthBackLink />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Forgot password" subtitle="We'll send a verification code (demo: 1234).">
      <form onSubmit={handleEmail} className="space-y-4">
        <AuthField label="Registered email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputCls}
          />
        </AuthField>
        {error && <AuthError message={error} />}
        <button type="submit" disabled={submitting} className={authBtnPrimary}>
          {submitting ? 'Sending…' : 'Send code'}
        </button>
      </form>
      <p className="text-xs text-slate-400 mt-4">Use seeded accounts e.g. msme@example.com</p>
      <AuthBackLink />
    </AuthLayout>
  )
}
