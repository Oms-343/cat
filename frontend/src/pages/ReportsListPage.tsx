import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  Award,
  BarChart3,
  ClipboardCheck,
  History,
  MapPin,
  ScrollText,
  TrendingUp,
} from 'lucide-react'
import { listReports } from '../api/reports'
import { ApiError } from '../api/client'
import type { ReportMeta } from '../types/report'
import { Alert, Badge, Button, Card, PageHeader, PageShell } from '../components/ui'

const HIDDEN_REPORT_SLUGS = new Set(['custom-summary'])

const reportIconMap: Record<string, LucideIcon> = {
  'sector-summary': BarChart3,
  'district-profile': MapPin,
  'growth-trends': TrendingUp,
  'profile-completion': ClipboardCheck,
  'certification-report': Award,
}

const reportCardIconClass = 'h-5 w-5 text-muted mb-2'

function ReportCardIcon({ slug }: { slug: string }) {
  const Icon = reportIconMap[slug] ?? BarChart3
  return <Icon className={reportCardIconClass} strokeWidth={1.75} aria-hidden />
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
        description="Pre-built reports for sector, district, growth, profile completion — exportable to Excel."
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {reports.filter((r) => !HIDDEN_REPORT_SLUGS.has(r.slug)).map((r) => (
            <Link key={r.slug} to={`/reports/${r.slug}`} className="block group">
              <Card
                padding="sm"
                className="h-full transition-shadow group-hover:shadow-md group-hover:border-ink/20"
              >
                <ReportCardIcon slug={r.slug} />
                <h3 className="text-sm font-semibold text-ink mb-0.5">{r.name}</h3>
                <p className="text-xs text-muted mb-2 leading-snug">{r.description}</p>
                {r.filters.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {r.filters.map((f) => (
                      <Badge
                        key={f.key}
                        className="normal-case tracking-normal"
                      >
                        {f.label}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            </Link>
          ))}

          <Link to="/audit-log" className="block group">
            <Card
              padding="sm"
              className="h-full transition-shadow group-hover:shadow-md group-hover:border-ink/20"
            >
              <ScrollText className={reportCardIconClass} strokeWidth={1.75} aria-hidden />
              <h3 className="text-sm font-semibold text-ink mb-0.5">Audit Trail Export</h3>
              <p className="text-xs text-muted mb-2 leading-snug">
                Every action on the platform, exportable to Excel. Lives in the Audit Log page.
              </p>
              <span className="text-xs font-semibold text-ink">Open Audit Log →</span>
            </Card>
          </Link>
        </div>
      )}
    </PageShell>
  )
}
