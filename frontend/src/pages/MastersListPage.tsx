import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listMasters } from '../api/masters'
import { ApiError } from '../api/client'
import { sortMastersForAdmin } from '../constants/adminMasters'
import type { MasterSummary } from '../types/master'

export function MastersListPage() {
  const [masters, setMasters] = useState<MasterSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listMasters()
      .then(setMasters)
      .catch((err) => {
        if (err instanceof ApiError) setError(`${err.status}: ${err.detail}`)
        else setError(String(err))
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Master Data</h1>
        <p className="text-sm text-slate-500">
          Lists used in company profiles, filters, reports, and onboarding — edit entries here
          to update dropdowns across the platform.
        </p>
      </header>

      {loading && <p className="text-sm text-slate-500">Loading…</p>}

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}

      {masters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {sortMastersForAdmin(masters).map((m) => (
            <Link
              key={m.key}
              to={`/masters/${m.key}`}
              className="block border border-hairline rounded-lg p-4 hover:border-brand-accent/40 hover:bg-surface-card/50 transition"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-sm font-semibold text-slate-900">{m.label}</h3>
                <span className="shrink-0 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                  {m.count}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-1.5 leading-snug">{m.description}</p>
              <div className="text-[10px] text-slate-400">
                {m.count} {m.count === 1 ? 'entry' : 'entries'}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
