import { api } from './client'
import type {
  MasterCreate,
  MasterEntry,
  MasterSummary,
  MasterUpdate,
} from '../types/master'

export function listMasters(): Promise<MasterSummary[]> {
  return api<MasterSummary[]>('/api/masters')
}

export function listEntries(
  key: string,
  params: { q?: string; active?: boolean } = {},
): Promise<MasterEntry[]> {
  const qs = new URLSearchParams()
  if (params.q) qs.set('q', params.q)
  if (params.active !== undefined) qs.set('active', String(params.active))
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return api<MasterEntry[]>(`/api/masters/${key}${suffix}`)
}

export function createEntry(key: string, payload: MasterCreate): Promise<MasterEntry> {
  return api<MasterEntry>(`/api/masters/${key}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateEntry(
  key: string,
  id: number,
  payload: MasterUpdate,
): Promise<MasterEntry> {
  return api<MasterEntry>(`/api/masters/${key}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteEntry(key: string, id: number): Promise<void> {
  return api<void>(`/api/masters/${key}/${id}`, { method: 'DELETE' })
}

export async function exportMaster(key: string): Promise<void> {
  const token = localStorage.getItem('msme.token')
  const res = await fetch(`/api/masters/${key}/export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error('Export failed')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${key}-master.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importMaster(
  key: string,
  file: File,
): Promise<{ created: number; updated: number }> {
  const form = new FormData()
  form.append('file', file)
  const token = localStorage.getItem('msme.token')
  const res = await fetch(`/api/masters/${key}/import`, {
    method: 'POST',
    body: form,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    let detail = 'Import failed'
    try {
      const body = await res.json()
      detail = body?.detail ?? detail
    } catch {
      /* ignore */
    }
    throw new Error(detail)
  }
  return res.json()
}
