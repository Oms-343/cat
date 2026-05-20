import { useEffect, useState, type FormEvent } from 'react'
import {
  createUser,
  deactivateUser,
  listUsers,
  resetPassword,
  updateUser,
} from '../api/users'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Modal } from '../components/Modal'
import type {
  PasswordResetResponse,
  User,
  UserCreate,
  UserRole,
} from '../types/auth'

const roleStyles: Record<string, string> = {
  super: 'bg-purple-100 text-purple-800 border-purple-200',
  admin: 'bg-blue-100 text-blue-800 border-blue-200',
  msme: 'bg-green-100 text-green-800 border-green-200',
}

const emptyForm: UserCreate = {
  email: '',
  full_name: '',
  designation: '',
  mobile: '',
  role: 'msme',
}

export function UsersPage() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState<User[] | null>(null)
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState<UserCreate>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [resetResult, setResetResult] = useState<PasswordResetResponse | null>(null)
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null)

  function refresh() {
    setLoading(true)
    listUsers({ q: q || undefined, role: roleFilter || undefined })
      .then(setUsers)
      .catch((err) => setError(err instanceof ApiError ? err.detail : String(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, roleFilter])

  function openAdd() {
    setForm(emptyForm)
    setFormError(null)
    setAddOpen(true)
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    setSaving(true)
    try {
      const res = await createUser({
        ...form,
        designation: form.designation?.trim() || null,
        mobile: form.mobile?.trim() || null,
        password: form.password?.trim() || null,
      })
      setWelcomeMessage(res.welcome_message)
      setAddOpen(false)
      refresh()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.detail : String(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleReset(u: User) {
    if (!confirm(`Reset password for ${u.full_name} (${u.email})?`)) return
    try {
      const res = await resetPassword(u.id)
      setResetResult(res)
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : String(err))
    }
  }

  async function handleDeactivate(u: User) {
    if (!confirm(`Deactivate ${u.full_name}? They won't be able to log in until reactivated.`)) return
    try {
      await deactivateUser(u.id)
      refresh()
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : String(err))
    }
  }

  async function handleToggleRole(u: User, newRole: UserRole) {
    try {
      await updateUser(u.id, { role: newRole })
      refresh()
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : String(err))
    }
  }

  const canDeactivate = me?.role === 'super'
  const canChangeRoles = me?.role === 'super'

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Users</h1>
          <p className="text-sm text-slate-500">
            {users ? `${users.length} user${users.length === 1 ? '' : 's'}` : 'Loading…'} ·
            Adds, password resets and activation changes are all audit-logged.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md"
        >
          + Add User
        </button>
      </header>

      {welcomeMessage && (
        <div className="mb-4 text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-3">
          <p className="font-medium mb-1">Welcome email (demo)</p>
          <p>{welcomeMessage}</p>
          <button type="button" className="text-xs underline mt-2" onClick={() => setWelcomeMessage(null)}>
            Dismiss
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or email…"
          className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
        >
          <option value="">All roles</option>
          <option value="super">Super</option>
          <option value="admin">Admin</option>
          <option value="msme">MSME</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {error && <div className="p-4 text-sm text-red-700 bg-red-50 border-b border-red-200">{error}</div>}
        {loading && <p className="p-6 text-sm text-slate-500">Loading…</p>}
        {!loading && users && users.length === 0 && (
          <p className="p-6 text-sm text-slate-500 text-center">No users match these filters.</p>
        )}
        {users && users.length > 0 && (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-2 px-4">Name</th>
                <th className="py-2 px-4">Email</th>
                <th className="py-2 px-4">Mobile</th>
                <th className="py-2 px-4">Role</th>
                <th className="py-2 px-4">Status</th>
                <th className="py-2 px-4">Last Login</th>
                <th className="py-2 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="py-2 px-4 font-medium text-slate-900">{u.full_name}</td>
                  <td className="py-2 px-4 text-slate-600">{u.email}</td>
                  <td className="py-2 px-4 text-slate-600 font-mono text-xs">{u.mobile ?? '—'}</td>
                  <td className="py-2 px-4">
                    {canChangeRoles && me?.id !== u.id ? (
                      <select
                        value={u.role}
                        onChange={(e) => handleToggleRole(u, e.target.value as UserRole)}
                        className={`text-xs font-semibold border rounded px-1.5 py-0.5 uppercase ${roleStyles[u.role] ?? ''}`}
                      >
                        <option value="super">super</option>
                        <option value="admin">admin</option>
                        <option value="msme">msme</option>
                      </select>
                    ) : (
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded border uppercase ${roleStyles[u.role] ?? ''}`}
                      >
                        {u.role}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-4">
                    {u.is_active ? (
                      <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">
                        Active
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-4 text-slate-500">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : '—'}
                  </td>
                  <td className="py-2 px-4 text-right space-x-2 whitespace-nowrap">
                    {me?.id !== u.id && (
                      <>
                        <button
                          onClick={() => handleReset(u)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Reset password
                        </button>
                        {canDeactivate && u.is_active && (
                          <button
                            onClick={() => handleDeactivate(u)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Deactivate
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={addOpen}
        title="Add User"
        onClose={() => setAddOpen(false)}
        footer={
          <>
            <button
              onClick={() => setAddOpen(false)}
              className="text-sm border border-slate-300 px-3 py-1.5 rounded-md hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-user-form"
              disabled={saving}
              className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium px-4 py-1.5 rounded-md"
            >
              {saving ? 'Creating…' : 'Create user'}
            </button>
          </>
        }
      >
        <form id="add-user-form" onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mobile</label>
            <input
              type="tel"
              value={form.mobile ?? ''}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Designation</label>
            <input
              type="text"
              value={form.designation ?? ''}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
            >
              <option value="super">Super</option>
              <option value="admin">Admin</option>
              <option value="msme">MSME</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
              <span className="text-slate-400 font-normal"> (leave blank to auto-generate)</span>
            </label>
            <input
              type="text"
              value={form.password ?? ''}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="auto-generate"
            />
          </div>
          {formError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">
              {formError}
            </div>
          )}
        </form>
      </Modal>

      <Modal
        open={resetResult !== null}
        title="Password Reset"
        onClose={() => setResetResult(null)}
        footer={
          <button
            onClick={() => setResetResult(null)}
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-1.5 rounded-md"
          >
            Done
          </button>
        }
      >
        {resetResult && (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              A temporary password has been generated for <strong>{resetResult.email}</strong>.
              Share it with the user out-of-band — they should change it after first login.
            </p>
            <div className="bg-slate-100 border border-slate-300 rounded-md px-3 py-2 font-mono text-sm select-all">
              {resetResult.temporary_password}
            </div>
            <p className="text-xs text-slate-500">
              This password won't be shown again. Copy it now.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
