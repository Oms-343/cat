import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileSpreadsheet, History, ScrollText } from 'lucide-react'
import { listReports } from '../api/reports'
import { ApiError } from '../api/client'
import type { ReportMeta } from '../types/report'
import { Alert, Badge, Button, Card, PageHeader, PageShell } from '../components/ui'

function ReportCardIcon({ slug }: { slug: string }) {
  const cls = 'h-8 w-8 text-muted mb-3'
  if (slug.includes('audit')) return <ScrollText className={cls} strokeWidth={1.75} />
  return <FileSpreadsheet className={cls} strokeWidth={1.75} />
}

export function ReportsListPage() {
  const [reports, setReports] = useState<ReportMeta[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listReports()
      .then(setReports)
      .catch((err) => setError(err instanceof ApiError ? err.detail : String(err)))
  }, [])

  return (
    <PageShell width="lg">
      <PageHeader
        title="MIS Reports"
        description="Pre-built reports for sector, district, growth, tag analytics, profile completion — exportable to Excel/CSV."
        actions={
          <Link to="/reports/history">
            <Button variant="secondary" size="sm" type="button" className="gap-2">
              <History className="h-4 w-4" aria-hidden />
              Export history
            </Button>
          </Link>
        }
      />

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {reports && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((r) => (
            <Link key={r.slug} to={`/reports/${r.slug}`} className="block group">
              <Card
                padding="md"
                className="h-full transition-shadow group-hover:shadow-md group-hover:border-ink/20"
              >
                <ReportCardIcon slug={r.slug} />
                <h3 className="font-semibold text-ink mb-1">{r.name}</h3>
                <p className="text-sm text-muted mb-3">{r.description}</p>
                {r.filters.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {r.filters.map((f) => (
                      <Badge
                        key={f.key}
                        tone={f.required ? 'error' : 'neutral'}
                        className="normal-case tracking-normal"
                      >
                        {f.label}
                        {f.required && ' *'}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            </Link>
          ))}

          <Link to="/audit-log" className="block group">
            <Card
              padding="md"
              className="h-full transition-shadow group-hover:shadow-md group-hover:border-ink/20"
            >
              <ScrollText className="h-8 w-8 text-muted mb-3" strokeWidth={1.75} aria-hidden />
              <h3 className="font-semibold text-ink mb-1">Audit Trail Export</h3>
              <p className="text-sm text-muted mb-3">
                Every action on the platform, exportable as CSV. Lives in the Audit Log page.
              </p>
              <span className="text-xs font-semibold text-ink">Open Audit Log →</span>
            </Card>
          </Link>
        </div>
      )}
    </PageShell>
  )
}
