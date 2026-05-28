export type BusinessActivity = 'manufacturing' | 'service' | 'trade'

export interface Company {
  id: number
  logo_url: string | null
  name: string
  legal_structure_code: string | null
  primary_place_of_business: string | null
  business_activity: BusinessActivity | null

  address_line1: string | null
  address_line2: string | null
  city: string | null
  district_code: string | null
  taluk_code: string | null
  pincode: string | null
  state: string

  sector_code: string | null

  contact_name: string | null
  contact_designation: string | null
  contact_email: string | null
  contact_phone: string | null
  website: string | null

  workforce_count: number | null
  turnover_range_code: string | null
  exact_turnover_lakhs: number | null
  is_mnc: boolean

  gst_number: string | null
  cin: string | null
  udyam_number: string | null
  pan: string | null

  tags: string[]
  owner_user_id: number | null
  created_at: string
  updated_at: string

  profile_completion: number
  section_completion: Record<string, boolean>
}

export interface CompanyListItem {
  id: number
  name: string
  gst_number: string | null
  sector_code: string | null
  district_code: string | null
  taluk_code: string | null
  pincode: string | null
  turnover_range_code: string | null
  tags: string[]
  profile_completion: number
  is_mnc: boolean
}

export interface CompanyListResponse {
  items: CompanyListItem[]
  total: number
  limit: number
  offset: number
}

export interface CompanyCreate {
  logo_url?: string | null
  name: string
  legal_structure_code?: string | null
  primary_place_of_business?: string | null
  business_activity?: BusinessActivity | null
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  district_code?: string | null
  taluk_code?: string | null
  pincode?: string | null
  state?: string
  sector_code?: string | null
  contact_name?: string | null
  contact_designation?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  website?: string | null
  workforce_count?: number | null
  turnover_range_code?: string | null
  exact_turnover_lakhs?: number | null
  is_mnc?: boolean
  gst_number?: string | null
  cin?: string | null
  udyam_number?: string | null
  pan?: string | null
  tags?: string[]
}

export type CompanyUpdate = Partial<CompanyCreate>

export interface CompanyFilters {
  q?: string
  sector?: string
  district?: string
  pincode?: string
  turnover?: string
  tag?: string
  limit?: number
  offset?: number
}

export interface LockedFields {
  locked_for_msme: string[]
  tag_edit_roles: string[]
}
