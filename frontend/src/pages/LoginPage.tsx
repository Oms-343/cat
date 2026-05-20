import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../api/client'
import type { LoginUserType } from '../api/auth'
import {
  AuthError,
  AuthField,
  AuthLayout,
  authBtnPrimary,
  authInputCls,
  DummyAccounts,
} from '../components/AuthLayout'

const dummyAccounts = [
  { role: 'Official (Super)', email: 'super@tidco.com', password: 'super123', userType: 'official' as LoginUserType },
  { role: 'Official (Admin)', email: 'admin@tidco.com', password: 'admin123', userType: 'official' as LoginUserType },
  { role: 'MSME', email: 'msme@example.com', password: 'msme123', userType: 'msme' as LoginUserType },
]

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [userType, setUserType] = useState<LoginUserType>('official')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard'
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password, userType)
      navigate(userType === 'msme' ? '/companies' : '/dashboard', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail)
      else setError('Login failed. Is the backend running?')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Sign in" subtitle="TIDCO · MSME Platform">
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField label="I am a">
          <select
            value={userType}
            onChange={(e) => setUserType(e.target.value as LoginUserType)}
            className={authInputCls}
          >
            <option value="official">Official User (TIDCO)</option>
            <option value="msme">MSME User</option>
          </select>
        </AuthField>

        <AuthField label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputCls}
            placeholder={userType === 'official' ? 'you@tidco.com' : 'you@example.com'}
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
        </AuthField>

        {error && <AuthError message={error} />}

        <button type="submit" disabled={submitting} className={authBtnPrimary}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        <Link to="/forgot-password" className="text-blue-600 hover:underline">
          Forgot password?
        </Link>
        {' · '}
        <Link to="/signup" className="text-blue-600 hover:underline">
          MSME sign up
        </Link>
      </p>

      <DummyAccounts
        accounts={dummyAccounts}
        onPick={(acc) => {
          setUserType(acc.userType)
          setEmail(acc.email)
          setPassword(acc.password)
        }}
      />
    </AuthLayout>
  )
}
