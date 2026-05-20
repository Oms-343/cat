import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listMasters } from '../api/masters'
import { ApiError } from '../api/client'
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
          Reference data that powers dropdowns and classifications across the platform.
        </p>
      </header>

      {loading && <p className="text-sm text-slate-500">Loading…</p>}

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}

      {masters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {masters.map((m) => (
            <Link
              key={m.key}
              to={`/masters/${m.key}`}
              className="block bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md hover:border-blue-300 transition"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-slate-900">{m.label}</h3>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                  {m.count}
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-3">{m.description}</p>
              <div className="text-xs text-slate-400">
                {m.active_count} active{' '}
                {m.count > m.active_count && (
                  <span className="text-slate-500">
                    · {m.count - m.active_count} inactive
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
