import { Link } from 'react-router-dom'
import { Alert, Card, Field } from '../components/ui'

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-soft p-4">
      <Card variant="elevated" className="w-full max-w-md shadow-md" padding="md">
        <header className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wide text-muted mb-2">
            MSME Platform
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
          <p className="text-sm text-muted mt-1">{subtitle}</p>
        </header>
        {children}
      </Card>
    </div>
  )
}

export function AuthField({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <Field label={label} htmlFor={htmlFor}>
      {children}
    </Field>
  )
}

export function AuthError({ message }: { message: string }) {
  return <Alert variant="error">{message}</Alert>
}

export function DummyAccounts<T extends { role: string; email: string }>({
  accounts,
  onPick,
}: {
  accounts: T[]
  onPick: (acc: T) => void
}) {
  return (
    <div className="mt-8 pt-6 border-t border-hairline">
      <p className="text-xs uppercase tracking-wide text-muted mb-2">Quick fill (dev)</p>
      <div className="space-y-1">
        {accounts.map((acc) => (
          <button
            key={acc.email}
            type="button"
            onClick={() => onPick(acc)}
            className="w-full text-left text-sm px-3 py-2 rounded-md hover:bg-surface-soft border border-hairline transition-colors"
          >
            <span className="font-medium text-ink">{acc.role}</span>
            <span className="text-muted"> · {acc.email}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-soft mt-2">
        Demo OTP for password reset: <strong className="text-ink">1234</strong>
      </p>
    </div>
  )
}

export function AuthBackLink({
  to = '/login',
  children = '← Back to sign in',
}: {
  to?: string
  children?: string
}) {
  return (
    <p className="mt-4 text-center text-sm">
      <Link to={to} className="text-ink font-medium hover:underline">
        {children}
      </Link>
    </p>
  )
}
