export interface ReportFilterSpec {
  key: string
  label: string
  type: 'master' | 'string' | 'date'
  master_key?: string | null
  required: boolean
}

export interface ReportMeta {
  slug: string
  name: string
  description: string
  icon: string
  filters: ReportFilterSpec[]
}

export interface ReportColumn {
  key: string
  label: string
  format?: string | null
}

export interface SubSheet {
  columns: ReportColumn[]
  rows: Record<string, unknown>[]
  summary?: Record<string, unknown>
}

export interface ReportRunResult {
  slug: string
  name: string
  filters_applied: Record<string, unknown>
  columns: ReportColumn[]
  rows: Record<string, unknown>[]
  summary: Record<string, unknown>
  sheets: Record<string, SubSheet>
  generated_at: string
}

export interface ReportRunHistoryEntry {
  id: number
  timestamp: string
  report_slug: string
  report_name: string
  format: string
  row_count: number
  filters: Record<string, unknown>
  user_id: number | null
  user_email: string | null
  user_role: string | null
  user_name: string | null
}

export interface ReportHistoryList {
  items: ReportRunHistoryEntry[]
  total: number
}

export type ReportFormat = 'xlsx' | 'csv'
