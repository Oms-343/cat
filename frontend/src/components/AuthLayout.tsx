import { Link } from 'react-router-dom'

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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </header>
        {children}
      </div>
    </div>
  )
}

export const authInputCls =
  'w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'

export const authBtnPrimary =
  'w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium py-2 rounded-md transition'

export function AuthField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

export function AuthError({ message }: { message: string }) {
  return (
    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{message}</div>
  )
}

export function DummyAccounts<T extends { role: string; email: string }>({
  accounts,
  onPick,
}: {
  accounts: T[]
  onPick: (acc: T) => void
}) {
  return (
    <div className="mt-8 pt-6 border-t border-slate-200">
      <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Quick fill (dev)</p>
      <div className="space-y-1">
        {accounts.map((acc) => (
          <button
            key={acc.email}
            type="button"
            onClick={() => onPick(acc)}
            className="w-full text-left text-sm px-3 py-2 rounded-md hover:bg-slate-100 border border-slate-200"
          >
            <span className="font-medium text-slate-900">{acc.role}</span>
            <span className="text-slate-500"> · {acc.email}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-2">
        Demo OTP for signup / password reset: <strong>1234</strong>
      </p>
    </div>
  )
}

export function AuthBackLink({ to = '/login', children = '← Back to sign in' }: { to?: string; children?: string }) {
  return (
    <p className="mt-4 text-center text-sm">
      <Link to={to} className="text-blue-600 hover:underline">
        {children}
      </Link>
    </p>
  )
}
