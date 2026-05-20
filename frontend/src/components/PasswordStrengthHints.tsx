import { checkPassword } from '../utils/passwordStrength'

export function PasswordStrengthHints({ password }: { password: string }) {
  const c = checkPassword(password)
  const items = [
    { ok: c.minLength, label: 'At least 8 characters' },
    { ok: c.uppercase, label: 'One capital letter' },
    { ok: c.number, label: 'One number' },
    { ok: c.special, label: 'One special character' },
  ]
  return (
    <ul className="mt-2 space-y-0.5 text-xs">
      {items.map((it) => (
        <li key={it.label} className={it.ok ? 'text-green-700' : 'text-slate-500'}>
          {it.ok ? '✓' : '○'} {it.label}
        </li>
      ))}
    </ul>
  )
}
