import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { exportReport, listReports, runReport } from '../api/reports'
import { listEntries } from '../api/masters'
import { ApiError } from '../api/client'
import type {
  ReportColumn,
  ReportFilterSpec,
  ReportFormat,
  ReportMeta,
  ReportRunResult,
} from '../types/report'
import type { MasterEntry } from '../types/master'

export function ReportRunPage() {
  const { slug = '' } = useParams<{ slug: string }>()

  const [report, setReport] = useState<ReportMeta | null>(null)
  const [masters, setMasters] = useState<Record<string, MasterEntry[]>>({})
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ReportRunResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exportingFormat, setExportingFormat] = useState<ReportFormat | null>(null)

  // Load report metadata + any required masters
  useEffect(() => {
    listReports()
      .then((list) => {
        const rd = list.find((r) => r.slug === slug)
        if (!rd) {
          setError(`Unknown report: ${slug}`)
          return
        }
        setReport(rd)

        // Pre-load master dropdowns referenced by filters
        const masterKeys = Array.from(
          new Set(rd.filters.filter((f) => f.type === 'master' && f.master_key).map((f) => f.master_key!)),
        )
        return Promise.all(
          masterKeys.map((k) => listEntries(k, { active: true }).then((rows) => [k, rows] as const)),
        ).then((entries) => {
          const map: Record<string, MasterEntry[]> = {}
          for (const [k, rows] of entries) map[k] = rows
          setMasters(map)
        })
      })
      .catch((err) => setError(err instanceof ApiError ? err.detail : String(err)))
  }, [slug])

  // Auto-run reports with no required filters
  useEffect(() => {
    if (report && !report.filters.some((f) => f.required)) {
      handleRun()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report])

  const allRequiredFilled = useMemo(() => {
    if (!report) return false
    return report.filters.filter((f) => f.required).every((f) => Boolean(filters[f.key]))
  }, [report, filters])

  async function handleRun() {
    if (!report) return
    setLoading(true)
    setError(null)
    try {
      const cleaned = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined),
      )
      const r = await runReport(report.slug, cleaned)
      setResult(r)
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleExport(format: ReportFormat) {
    if (!report) return
    setExportingFormat(format)
    try {
      const cleaned = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined),
      )
      await exportReport(report.slug, cleaned, format)
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setExportingFormat(null)
    }
  }

  function clearFilters() {
    setFilters({})
    setResult(null)
  }

  if (error && !report) {
    return (
      <div className="p-8">
        <Link to="/reports" className="text-sm text-blue-600 hover:underline">
          ← All reports
        </Link>
        <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>
      </div>
    )
  }

  if (!report) {
    return <p className="p-8 text-sm text-slate-500">Loading…</p>
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <Link to="/reports" className="text-sm text-blue-600 hover:underline">
        ← All reports
      </Link>
      <header className="mt-2 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {report.icon} {report.name}
        </h1>
        <p className="text-sm text-slate-500">{report.description}</p>
      </header>

      {report.filters.length > 0 && (
        <div className="border border-hairline rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            {report.filters.map((f) => (
              <FilterInput
                key={f.key}
                spec={f}
                value={filters[f.key] ?? ''}
                onChange={(v) => setFilters({ ...filters, [f.key]: v })}
                masters={masters}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRun}
              disabled={!allRequiredFilled || loading}
              className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium px-4 py-1.5 rounded-md"
            >
              {loading ? 'Running…' : 'Run report'}
            </button>
            {Object.values(filters).some(Boolean) && (
              <button
                onClick={clearFilters}
                className="text-sm border border-slate-300 px-3 py-1.5 rounded-md hover:bg-slate-100"
              >
                Clear
              </button>
            )}
            {!allRequiredFilled && (
              <span className="text-xs text-amber-700 ml-2">
                Fill the required filters to run this report.
              </span>
            )}
          </div>
        </div>
      )}

      {error && result === null && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          {error}
        </div>
      )}

      {result && (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-500">
              Generated {new Date(result.generated_at).toLocaleString()} ·{' '}
              {result.rows.length} row{result.rows.length === 1 ? '' : 's'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('csv')}
                disabled={exportingFormat !== null}
                className="text-sm border border-slate-300 px-3 py-1.5 rounded-md hover:bg-slate-100 disabled:opacity-50"
              >
                {exportingFormat === 'csv' ? 'Exporting…' : 'Export CSV'}
              </button>
              <button
                onClick={() => handleExport('xlsx')}
                disabled={exportingFormat !== null}
                className="text-sm bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-medium px-3 py-1.5 rounded-md"
              >
                {exportingFormat === 'xlsx' ? 'Exporting…' : 'Export Excel'}
              </button>
            </div>
          </div>

          {Object.keys(result.summary).length > 0 && (
            <SummaryCards summary={result.summary} />
          )}

          <ResultTable columns={result.columns} rows={result.rows} title="Primary" />

          {Object.entries(result.sheets).map(([name, sheet]) => (
            <ResultTable
              key={name}
              columns={sheet.columns}
              rows={sheet.rows}
              title={name}
              summary={sheet.summary}
            />
          ))}
        </>
      )}
    </div>
  )
}

function FilterInput({
  spec,
  value,
  onChange,
  masters,
}: {
  spec: ReportFilterSpec
  value: string
  onChange: (v: string) => void
  masters: Record<string, MasterEntry[]>
}) {
  const cls =
    'w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  if (spec.type === 'master' && spec.master_key) {
    const opts = masters[spec.master_key] ?? []
    return (
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          {spec.label}
          {spec.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <select value={value} onChange={(e) => onChange(e.target.value)} className={cls}>
          <option value="">{spec.required ? `Select ${spec.label}…` : `All ${spec.label.toLowerCase()}`}</option>
          {opts.map((o) => (
            <option key={o.code} value={o.code}>
              {o.name}
            </option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">
        {spec.label}
        {spec.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={spec.type === 'date' ? 'date' : 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cls}
      />
    </div>
  )
}

function SummaryCards({ summary }: { summary: Record<string, unknown> }) {
  const entries = Object.entries(summary)
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {entries.map(([k, v]) => (
        <div key={k} className="border border-hairline rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">
            {k.replace(/_/g, ' ')}
          </p>
          <p className="text-lg font-bold text-slate-900 mt-0.5">{formatCell(v)}</p>
        </div>
      ))}
    </div>
  )
}

function ResultTable({
  columns,
  rows,
  title,
  summary,
}: {
  columns: ReportColumn[]
  rows: Record<string, unknown>[]
  title: string
  summary?: Record<string, unknown>
}) {
  return (
    <section className="mb-6">
      <h2 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">{title}</h2>
      {summary && Object.keys(summary).length > 0 && (
        <p className="text-xs text-slate-500 mb-2">
          {Object.entries(summary)
            .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${formatCell(v)}`)
            .join(' · ')}
        </p>
      )}
      <div className="bg-surface-card border border-hairline rounded-lg overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-slate-500 text-center">No rows.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="py-2 px-4">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  {columns.map((c) => (
                    <td key={c.key} className="py-2 px-4 text-slate-700">
                      {formatCell(row[c.key], c.format)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

function formatCell(value: unknown, format?: string | null): string {
  if (value === null || value === undefined || value === '') return '—'
  if (format === 'number') return Number(value).toLocaleString()
  if (format === 'decimal') {
    const n = Number(value)
    return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(value)
  }
  return String(value)
}
