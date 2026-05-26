import { api } from './client'

export interface MasterOption {
  code: string
  name: string
}

export interface EnrollPrefill {
  name?: string | null
  phone?: string | null
  email?: string | null
  legal_structure_code?: string | null
  primary_place_of_business?: string | null
  business_activity?: string | null
  district_code?: string | null
  sector_code?: string | null
  taluk_code?: string | null
  contact_name?: string | null
  contact_phone?: string | null
  contact_email?: string | null
  contact_designation?: string | null
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  pincode?: string | null
  state?: string | null
  website?: string | null
  gst_number?: string | null
  cin?: string | null
  udyam_number?: string | null
  pan?: string | null
  workforce_count?: number | null
  turnover_range_code?: string | null
  exact_turnover_lakhs?: number | null
  is_mnc?: boolean | null
  tags?: string[] | null
}

export interface EnrollInvite {
  token: string
  kind: string
  status: string
  recipient_name: string
  company_id: number | null
  tab1_complete: boolean
  can_submit_tab1: boolean
  can_access_tab2: boolean
  profile_completion: number | null
  section_completion: Record<string, boolean> | null
  prefill: EnrollPrefill
  expires_at: string | null
}

export interface Tab1Payload {
  name: string
  contact_phone?: string
  contact_name?: string
  contact_designation?: string
  contact_email?: string
  legal_structure_code?: string
  primary_place_of_business?: string
  business_activity: string
  district_code: string
  sector_code: string
  taluk_code?: string
  address_line1: string
  address_line2?: string
  city: string
  pincode: string
  state?: string
  website?: string
  workforce_count: number
  turnover_range_code: string
  exact_turnover_lakhs?: number
  is_mnc?: boolean
  gst_number: string
  cin: string
  udyam_number: string
  pan: string
}

export interface Tab1Response {
  company_id: number
  tab1_complete: boolean
  profile_completion: number
  section_completion: Record<string, boolean>
  message: string
}

export function fetchInvite(token: string): Promise<EnrollInvite> {
  return api<EnrollInvite>(`/api/enroll/${token}`)
}

export function submitTab1(token: string, payload: Tab1Payload): Promise<Tab1Response> {
  return api<Tab1Response>(`/api/enroll/${token}/tab1`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateTags(token: string, tags: string[]): Promise<unknown> {
  return api(`/api/enroll/${token}/tags`, {
    method: 'PATCH',
    body: JSON.stringify({ tags }),
  })
}

export function fetchMasterOptions(key: string): Promise<MasterOption[]> {
  return api<MasterOption[]>(`/api/enroll/meta/${key}`)
}
