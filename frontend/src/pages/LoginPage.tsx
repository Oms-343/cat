import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { homePathForRole } from '../auth/homePath'
import { ApiError } from '../api/client'
import {
  AuthError,
  AuthField,
  AuthLayout,
  DummyAccounts,
} from '../layouts/AuthLayout'
import { Button, Input } from '../components/ui'

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
        <AuthField label="Email" htmlFor="login-email">
          <Input
            id="login-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@tidco.com"
          />
        </AuthField>

        <AuthField label="Password" htmlFor="login-password">
          <Input
            id="login-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </AuthField>

        {error && <AuthError message={error} />}

        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted">
        <Link to="/forgot-password" className="text-ink font-medium hover:underline">
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
