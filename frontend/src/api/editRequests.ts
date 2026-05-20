import { api } from './client'

export interface EditRequest {
  id: number
  company_id: number
  company_name: string | null
  requested_by_user_id: number
  requested_by_name: string | null
  status: 'pending' | 'approved' | 'rejected'
  proposed_changes: Record<string, unknown>
  review_note: string | null
  reviewed_by_name: string | null
  created_at: string
  reviewed_at: string | null
}

export function listPendingEditRequests(): Promise<EditRequest[]> {
  return api<EditRequest[]>('/api/companies/edit-requests/pending')
}

export function createEditRequest(
  companyId: number,
  proposed_changes: Record<string, unknown>,
): Promise<EditRequest> {
  return api<EditRequest>(`/api/companies/${companyId}/edit-requests`, {
    method: 'POST',
    body: JSON.stringify({ proposed_changes }),
  })
}

export function reviewEditRequest(
  requestId: number,
  approve: boolean,
  review_note?: string,
): Promise<EditRequest> {
  return api<EditRequest>(`/api/companies/edit-requests/${requestId}/review`, {
    method: 'POST',
    body: JSON.stringify({ approve, review_note }),
  })
}
