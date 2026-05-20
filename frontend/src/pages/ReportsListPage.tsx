import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listReports } from '../api/reports'
import { ApiError } from '../api/client'
import type { ReportMeta } from '../types/report'

export function ReportsListPage() {
  const [reports, setReports] = useState<ReportMeta[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listReports()
      .then(setReports)
      .catch((err) => setError(err instanceof ApiError ? err.detail : String(err)))
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">MIS Reports</h1>
          <p className="text-sm text-slate-500">
            Pre-built reports for sector, district, growth, tag analytics, profile completion — exportable to Excel/CSV.
          </p>
        </div>
        <Link
          to="/reports/history"
          className="text-sm border border-slate-300 px-3 py-2 rounded-md hover:bg-slate-100"
        >
          📜 Export history
        </Link>
      </header>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          {error}
        </div>
      )}

      {reports && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((r) => (
            <Link
              key={r.slug}
              to={`/reports/${r.slug}`}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-blue-300 transition"
            >
              <div className="text-2xl mb-2">{r.icon}</div>
              <h3 className="font-semibold text-slate-900 mb-1">{r.name}</h3>
              <p className="text-sm text-slate-500 mb-3">{r.description}</p>
              {r.filters.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {r.filters.map((f) => (
                    <span
                      key={f.key}
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                        f.required
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {f.label}
                      {f.required && ' *'}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}

          {/* Audit trail — references existing audit log page */}
          <Link
            to="/audit-log"
            className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-blue-300 transition"
          >
            <div className="text-2xl mb-2">🧾</div>
            <h3 className="font-semibold text-slate-900 mb-1">Audit Trail Export</h3>
            <p className="text-sm text-slate-500 mb-3">
              Every action on the platform, exportable as CSV. Lives in the Audit Log page.
            </p>
            <span className="text-xs font-semibold px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">
              Open Audit Log →
            </span>
          </Link>
        </div>
      )}
    </div>
  )
}
