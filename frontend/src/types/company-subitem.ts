export type CustomerType = 'business' | 'government' | 'export'

export interface CompanyProduct {
  id: number
  company_id: number
  name: string
  description: string | null
  hsn_code: string | null
  image_url: string | null
  tags: string[]
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CompanyCertification {
  id: number
  company_id: number
  certification_code: string
  certificate_number: string | null
  issued_date: string | null
  expiry_date: string | null
  issuer: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CompanyCustomer {
  id: number
  company_id: number
  name: string
  customer_type: CustomerType
  country: string | null
  relationship_years: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CompanyMachinery {
  id: number
  company_id: number
  name: string
  quantity: number | null
  capacity_value: number | null
  capacity_unit: string | null
  description: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type ProductPayload = Partial<Omit<CompanyProduct, 'id' | 'company_id' | 'created_at' | 'updated_at'>>
export type CertificationPayload = Partial<Omit<CompanyCertification, 'id' | 'company_id' | 'created_at' | 'updated_at'>>
export type CustomerPayload = Partial<Omit<CompanyCustomer, 'id' | 'company_id' | 'created_at' | 'updated_at'>>
export type MachineryPayload = Partial<Omit<CompanyMachinery, 'id' | 'company_id' | 'created_at' | 'updated_at'>>
