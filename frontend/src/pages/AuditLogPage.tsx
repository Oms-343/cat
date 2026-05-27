import { useEffect, useState } from 'react'
import { exportAuditCsv, listAudit } from '../api/audit'
import { ApiError } from '../api/client'
import { ACTION_TYPES, RESOURCE_TYPES } from '../types/audit'
import type { AuditLogEntry, AuditLogList } from '../types/audit'

const PAGE_SIZE = 25

const roleStyles: Record<string, string> = {
  super: 'bg-purple-100 text-purple-800 border-purple-200',
  admin: 'bg-blue-100 text-blue-800 border-blue-200',
  msme: 'bg-green-100 text-green-800 border-green-200',
}

const actionStyles: Record<string, string> = {
  USER_LOGIN: 'bg-slate-100 text-slate-700 border-slate-200',
  USER_CREATED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  USER_UPDATED: 'bg-blue-50 text-blue-800 border-blue-200',
  USER_DEACTIVATED: 'bg-red-50 text-red-800 border-red-200',
  USER_PASSWORD_RESET: 'bg-amber-50 text-amber-800 border-amber-200',
  COMPANY_CREATED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  COMPANY_UPDATED: 'bg-blue-50 text-blue-800 border-blue-200',
  COMPANY_TAGGED: 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200',
  COMPANY_DELETED: 'bg-red-50 text-red-800 border-red-200',
  MASTER_ENTRY_CREATED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  MASTER_ENTRY_UPDATED: 'bg-blue-50 text-blue-800 border-blue-200',
  MASTER_ENTRY_DELETED: 'bg-red-50 text-red-800 border-red-200',
}

function formatDetails(entry: AuditLogEntry): string {
  if (!entry.details || Object.keys(entry.details).length === 0) return ''

  const d = entry.details as Record<string, unknown>
  if (entry.action === 'COMPANY_TAGGED') {
    const before = (d.tags_before as string[]) ?? []
    const after = (d.tags_after as string[]) ?? []
    const added = after.filter((t) => !before.includes(t))
    const removed = before.filter((t) => !after.includes(t))
    const parts: string[] = []
    if (added.length) parts.push(`+${added.join(', ')}`)
    if (removed.length) parts.push(`-${removed.join(', ')}`)
    return parts.join(' · ') || `${after.length} tag${after.length === 1 ? '' : 's'}`
  }
  if (Array.isArray(d.fields_changed)) {
    const fields = d.fields_changed as string[]
    return `${fields.length} field${fields.length === 1 ? '' : 's'} updated: ${fields.join(', ')}`
  }
  if (typeof d.master_key === 'string') {
    return `${d.master_key}${d.code ? ` · ${d.code}` : ''}`
  }
  if (typeof d.target_user_email === 'string') {
    return `For user ${d.target_user_email}`
  }
  if (typeof d.role === 'string') {
    return `Role: ${d.role}`
  }
  // Fallback — compact JSON
  return JSON.stringify(d)
}

export function AuditLogPage() {
  const [data, setData] = useState<AuditLogList | null>(null)
  const [action, setAction] = useState('')
  const [resourceType, setResourceType] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [since, setSince] = useState('')
  const [until, setUntil] = useState('')
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    setLoading(true)
    listAudit({
      action: action || undefined,
      resource_type: resourceType || undefined,
      user_email: userEmail || undefined,
      since: since || undefined,
      until: until || undefined,
      limit: PAGE_SIZE,
      offset,
    })
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.detail : String(err)))
      .finally(() => setLoading(false))
  }, [action, resourceType, userEmail, since, until, offset])

  async function handleExport() {
    setExporting(true)
    try {
      await exportAuditCsv({
        action: action || undefined,
        resource_type: resourceType || undefined,
        user_email: userEmail || undefined,
        since: since || undefined,
        until: until || undefined,
      })
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setExporting(false)
    }
  }

  function clearFilters() {
    setAction('')
    setResourceType('')
    setUserEmail('')
    setSince('')
    setUntil('')
    setOffset(0)
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1
  const anyFilter = action || resourceType || userEmail || since || until

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
          <p className="text-sm text-slate-500">
            Every mutating action across the platform — logins, profile edits, tag changes, master updates, password resets.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="text-sm border border-slate-300 px-3 py-2 rounded-md hover:bg-slate-100 disabled:opacity-50"
        >
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </header>

      <div className="border border-hairline rounded-lg p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <select
            value={action}
            onChange={(e) => {
              setOffset(0)
              setAction(e.target.value)
            }}
            className="px-3 py-2 border border-hairline rounded-md text-sm bg-transparent"
          >
            <option value="">All actions</option>
            {ACTION_TYPES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select
            value={resourceType}
            onChange={(e) => {
              setOffset(0)
              setResourceType(e.target.value)
            }}
            className="px-3 py-2 border border-hairline rounded-md text-sm bg-transparent"
          >
            <option value="">All resource types</option>
            {RESOURCE_TYPES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <input
            type="email"
            value={userEmail}
            onChange={(e) => {
              setOffset(0)
              setUserEmail(e.target.value)
            }}
            placeholder="User email"
            className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="datetime-local"
            value={since}
            onChange={(e) => {
              setOffset(0)
              setSince(e.target.value)
            }}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          />
          <input
            type="datetime-local"
            value={until}
            onChange={(e) => {
              setOffset(0)
              setUntil(e.target.value)
            }}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          />
        </div>
        {anyFilter && (
          <div className="mt-3">
            <button onClick={clearFilters} className="text-xs text-slate-600 hover:text-slate-900 underline">
              Clear filters
            </button>
          </div>
        )}
      </div>

      <div className="bg-surface-card rounded-lg border border-hairline overflow-hidden">
        {error && <div className="p-4 text-sm text-red-700 bg-red-50 border-b border-red-200">{error}</div>}
        {loading && <p className="p-6 text-sm text-slate-500">Loading…</p>}

        {!loading && data && data.items.length === 0 && (
          <p className="p-6 text-sm text-slate-500 text-center">No log entries match these filters.</p>
        )}

        {!loading && data && data.items.length > 0 && (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-2 px-4">Time</th>
                <th className="py-2 px-4">Action</th>
                <th className="py-2 px-4">Resource</th>
                <th className="py-2 px-4">Details</th>
                <th className="py-2 px-4">Who</th>
                <th className="py-2 px-4">Role</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 align-top">
                  <td className="py-2 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(r.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2 px-4">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase whitespace-nowrap ${actionStyles[r.action] ?? 'bg-slate-50 text-slate-700 border-slate-200'}`}
                    >
                      {r.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-slate-700">
                    <div className="font-medium">{r.resource_name ?? '—'}</div>
                    {r.resource_type && (
                      <div className="text-[10px] text-slate-500 uppercase">{r.resource_type}</div>
                    )}
                  </td>
                  <td className="py-2 px-4 text-slate-600 text-xs">{formatDetails(r)}</td>
                  <td className="py-2 px-4 text-slate-700">
                    <div className="font-medium">{r.user_name ?? '—'}</div>
                    <div className="text-xs text-slate-500">{r.user_email ?? ''}</div>
                  </td>
                  <td className="py-2 px-4">
                    {r.user_role && (
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded border uppercase ${roleStyles[r.user_role] ?? ''}`}
                      >
                        {r.user_role}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && data && data.total > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 text-sm">
            <p className="text-slate-500">
              Page {currentPage} of {totalPages} · {data.total.toLocaleString()} entries
            </p>
            <div className="flex gap-2">
              <button
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                className="px-3 py-1.5 border border-slate-300 rounded-md disabled:opacity-50 hover:bg-slate-100"
              >
                ← Prev
              </button>
              <button
                disabled={offset + PAGE_SIZE >= data.total}
                onClick={() => setOffset(offset + PAGE_SIZE)}
                className="px-3 py-1.5 border border-slate-300 rounded-md disabled:opacity-50 hover:bg-slate-100"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
