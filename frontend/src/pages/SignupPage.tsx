import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { signupRequestOtp, signupVerify } from '../api/auth'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import {
  AuthBackLink,
  AuthError,
  AuthField,
  AuthLayout,
  authBtnPrimary,
  authInputCls,
  DummyAccounts,
} from '../components/AuthLayout'
import { PasswordStrengthHints } from '../components/PasswordStrengthHints'
import { passwordIsStrong } from '../utils/passwordStrength'

type Step = 'details' | 'otp' | 'done'

export function SignupPage() {
  const { user, applyLogin } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('details')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [gst, setGst] = useState('')
  const [otp, setOtp] = useState('')
  const [demoOtp, setDemoOtp] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/my-profile" replace />

  async function handleDetails(e: FormEvent) {
    e.preventDefault()
    if (!passwordIsStrong(password)) {
      setError('Password does not meet the requirements below.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const res = await signupRequestOtp({
        email,
        password,
        full_name: fullName,
        gst_number: gst.trim() || undefined,
      })
      setDemoOtp(res.demo_otp)
      setStep('otp')
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleOtp(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await signupVerify(email, otp)
      applyLogin(res)
      setStep('done')
      setTimeout(() => navigate('/my-profile', { replace: true }), 1500)
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'done') {
    return (
      <AuthLayout title="Welcome!" subtitle="Your MSME account is ready.">
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-4">
          Account created with a starter company profile (govt records pre-filled where available).
          Redirecting…
        </p>
      </AuthLayout>
    )
  }

  if (step === 'otp') {
    return (
      <AuthLayout title="Verify email" subtitle="Enter the 4-digit code (demo: 1234).">
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
              className={authInputCls + ' font-mono tracking-widest'}
              placeholder="1234"
            />
          </AuthField>
          {error && <AuthError message={error} />}
          <button type="submit" disabled={submitting} className={authBtnPrimary}>
            {submitting ? 'Verifying…' : 'Verify & continue'}
          </button>
        </form>
        <AuthBackLink />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="MSME sign up" subtitle="Register your business on the TIDCO platform.">
      <form onSubmit={handleDetails} className="space-y-4">
        <AuthField label="Full name">
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={authInputCls}
          />
        </AuthField>
        <AuthField label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputCls}
            placeholder="owner@yourcompany.example"
          />
        </AuthField>
        <AuthField label="GST number (optional — pre-fills from govt records)">
          <input
            value={gst}
            onChange={(e) => setGst(e.target.value.toUpperCase())}
            className={authInputCls + ' font-mono'}
            placeholder="33ABCXY1234R1Z5"
          />
        </AuthField>
        <AuthField label="Password">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputCls}
          />
          <PasswordStrengthHints password={password} />
        </AuthField>
        {error && <AuthError message={error} />}
        <button type="submit" disabled={submitting} className={authBtnPrimary}>
          {submitting ? 'Sending code…' : 'Send verification code'}
        </button>
      </form>
      <AuthBackLink />
      <DummyAccounts
        accounts={[{ role: 'Try Velocity GST prefill', email: 'new@example.com' }]}
        onPick={() => {
          setGst('33ABCXY1234R1Z5')
          setFullName('Vignesh Kumar')
          setEmail('vignesh.new@example.com')
          setPassword('MsmePass1!')
        }}
      />
    </AuthLayout>
  )
}
