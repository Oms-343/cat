import { api } from './client'
import type {
  CertificationPayload,
  CompanyCertification,
  CompanyCustomer,
  CompanyMachinery,
  CompanyProduct,
  CustomerPayload,
  MachineryPayload,
  ProductPayload,
} from '../types/company-subitem'

function makeApi<T, P>(section: string) {
  return {
    list: (companyId: number) => api<T[]>(`/api/companies/${companyId}/${section}`),
    create: (companyId: number, payload: P) =>
      api<T>(`/api/companies/${companyId}/${section}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (companyId: number, itemId: number, payload: P) =>
      api<T>(`/api/companies/${companyId}/${section}/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    remove: (companyId: number, itemId: number) =>
      api<void>(`/api/companies/${companyId}/${section}/${itemId}`, {
        method: 'DELETE',
      }),
  }
}

export const products = makeApi<CompanyProduct, ProductPayload>('products')
export const certifications = makeApi<CompanyCertification, CertificationPayload>('certifications')
export const customers = makeApi<CompanyCustomer, CustomerPayload>('customers')
export const machinery = makeApi<CompanyMachinery, MachineryPayload>('machinery')
