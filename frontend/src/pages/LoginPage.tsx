import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { homePathForRole } from '../auth/homePath'
import { ApiError } from '../api/client'
import {
  AuthError,
  AuthField,
  AuthLayout,
  authBtnPrimary,
  authInputCls,
  DummyAccounts,
} from '../components/AuthLayout'

const dummyAccounts = [
  { role: 'TIDCO Admin', email: 'admin@tidco.com', password: 'admin123' },
]

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
    const destination = from && from !== '/login' ? from : homePathForRole(user.role)
    return <Navigate to={destination} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
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
        <AuthField label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputCls}
            placeholder="you@tidco.com"
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
      </p>

      <DummyAccounts
        accounts={dummyAccounts}
        onPick={(acc) => {
          setEmail(acc.email)
          setPassword(acc.password)
        }}
      />
    </AuthLayout>
  )
}
