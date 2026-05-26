import type { EnrollPrefill } from '../api/enroll'

export interface Tab1FormValues {
  name: string
  legal_structure_code: string
  primary_place_of_business: string
  business_activity: string
  address_line1: string
  address_line2: string
  city: string
  district_code: string
  taluk_code: string
  pincode: string
  state: string
  sector_code: string
  contact_name: string
  contact_designation: string
  contact_email: string
  contact_phone: string
  website: string
  workforce_count: string
  turnover_range_code: string
  exact_turnover_lakhs: string
  is_mnc: boolean
  gst_number: string
  cin: string
  udyam_number: string
  pan: string
}

export function prefillToForm(p: EnrollPrefill, recipientName: string): Tab1FormValues {
  return {
    name: p.name ?? recipientName,
    legal_structure_code: p.legal_structure_code ?? '',
    primary_place_of_business: p.primary_place_of_business ?? '',
    business_activity: p.business_activity ?? '',
    address_line1: p.address_line1 ?? '',
    address_line2: p.address_line2 ?? '',
    city: p.city ?? '',
    district_code: p.district_code ?? '',
    taluk_code: p.taluk_code ?? '',
    pincode: p.pincode ?? '',
    state: p.state ?? 'Tamil Nadu',
    sector_code: p.sector_code ?? '',
    contact_name: p.contact_name ?? recipientName,
    contact_designation: p.contact_designation ?? '',
    contact_email: p.contact_email ?? p.email ?? '',
    contact_phone: p.contact_phone ?? p.phone ?? '',
    website: p.website ?? '',
    workforce_count: p.workforce_count?.toString() ?? '',
    turnover_range_code: p.turnover_range_code ?? '',
    exact_turnover_lakhs: p.exact_turnover_lakhs?.toString() ?? '',
    is_mnc: p.is_mnc ?? false,
    gst_number: p.gst_number ?? '',
    cin: p.cin ?? '',
    udyam_number: p.udyam_number ?? '',
    pan: p.pan ?? '',
  }
}

export function formToTab1Payload(v: Tab1FormValues) {
  const blank = (s: string) => (s.trim() === '' ? undefined : s.trim())
  return {
    name: v.name.trim(),
    contact_phone: v.contact_phone.trim() || undefined,
    contact_name: blank(v.contact_name),
    contact_designation: blank(v.contact_designation),
    contact_email: blank(v.contact_email),
    legal_structure_code: blank(v.legal_structure_code),
    primary_place_of_business: blank(v.primary_place_of_business),
    business_activity: v.business_activity,
    district_code: v.district_code,
    sector_code: v.sector_code,
    taluk_code: blank(v.taluk_code),
    address_line1: v.address_line1.trim(),
    address_line2: blank(v.address_line2),
    city: v.city.trim(),
    pincode: v.pincode.trim(),
    state: v.state.trim() || 'Tamil Nadu',
    website: blank(v.website),
    workforce_count: Number(v.workforce_count),
    turnover_range_code: v.turnover_range_code,
    exact_turnover_lakhs: v.exact_turnover_lakhs.trim() ? Number(v.exact_turnover_lakhs) : undefined,
    is_mnc: v.is_mnc,
    gst_number: v.gst_number.trim(),
    cin: v.cin.trim(),
    udyam_number: v.udyam_number.trim(),
    pan: v.pan.trim(),
  }
}

export function validateTab1Client(v: Tab1FormValues): string[] {
  const missing: string[] = []
  const req: [keyof Tab1FormValues, string][] = [
    ['name', 'Company name'],
    ['business_activity', 'Business activity'],
    ['address_line1', 'Address'],
    ['city', 'City'],
    ['district_code', 'District'],
    ['pincode', 'Pincode'],
    ['sector_code', 'Sector'],
    ['contact_name', 'Contact name'],
    ['contact_email', 'Contact email'],
    ['contact_phone', 'Contact phone'],
    ['workforce_count', 'Workforce count'],
    ['turnover_range_code', 'Turnover range'],
    ['gst_number', 'GSTIN'],
    ['cin', 'CIN'],
    ['udyam_number', 'Udyam number'],
    ['pan', 'PAN'],
  ]
  for (const [key, label] of req) {
    const val = v[key]
    if (typeof val === 'string' && val.trim() === '') missing.push(label)
    if (key === 'workforce_count' && (val === '' || Number.isNaN(Number(val)))) missing.push(label)
  }
  return missing
}
