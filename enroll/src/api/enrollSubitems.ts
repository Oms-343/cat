import { api } from './client'

function sectionApi<T>(section: string) {
  return {
    list: (token: string) => api<T[]>(`/api/enroll/${token}/${section}`),
    create: (token: string, payload: Record<string, unknown>) =>
      api<T>(`/api/enroll/${token}/${section}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (token: string, id: number, payload: Record<string, unknown>) =>
      api<T>(`/api/enroll/${token}/${section}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    remove: (token: string, id: number) =>
      api<void>(`/api/enroll/${token}/${section}/${id}`, { method: 'DELETE' }),
  }
}

export interface CompanyProduct {
  id: number
  name: string
  description: string | null
  hsn_code: string | null
  image_url: string | null
  tags: string[]
}

export interface CompanyCertification {
  id: number
  certification_code: string
  certificate_number: string | null
  issued_date: string | null
  expiry_date: string | null
  issuer: string | null
  notes: string | null
}

export interface CompanyCustomer {
  id: number
  name: string
  customer_type: 'business' | 'government' | 'export'
  country: string | null
  relationship_years: number | null
  notes: string | null
}

export interface CompanyMachinery {
  id: number
  name: string
  quantity: number | null
  capacity_value: number | null
  capacity_unit: string | null
  description: string | null
}

export const productsApi = sectionApi<CompanyProduct>('products')
export const certificationsApi = sectionApi<CompanyCertification>('certifications')
export const customersApi = sectionApi<CompanyCustomer>('customers')
export const machineryApi = sectionApi<CompanyMachinery>('machinery')
