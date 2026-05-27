import { Lock } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { Company, CompanyCreate } from '../types/company'
import type { MasterEntry } from '../types/master'
import { loadTalukIndex, type TalukIndex } from './maps/tnLayoutMap'
import { inputClassName } from './ui/Input'

export interface CompanyFormValues {
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

export const emptyCompanyForm: CompanyFormValues = {
  name: '',
  legal_structure_code: '',
  primary_place_of_business: '',
  business_activity: '',
  address_line1: '',
  address_line2: '',
  city: '',
  district_code: '',
  taluk_code: '',
  pincode: '',
  state: 'Tamil Nadu',
  sector_code: '',
  contact_name: '',
  contact_designation: '',
  contact_email: '',
  contact_phone: '',
  website: '',
  workforce_count: '',
  turnover_range_code: '',
  exact_turnover_lakhs: '',
  is_mnc: false,
  gst_number: '',
  cin: '',
  udyam_number: '',
  pan: '',
}

export function companyToForm(c: Company): CompanyFormValues {
  return {
    name: c.name ?? '',
    legal_structure_code: c.legal_structure_code ?? '',
    primary_place_of_business: c.primary_place_of_business ?? '',
    business_activity: c.business_activity ?? '',
    address_line1: c.address_line1 ?? '',
    address_line2: c.address_line2 ?? '',
    city: c.city ?? '',
    district_code: c.district_code ?? '',
    taluk_code: c.taluk_code ?? '',
    pincode: c.pincode ?? '',
    state: c.state ?? 'Tamil Nadu',
    sector_code: c.sector_code ?? '',
    contact_name: c.contact_name ?? '',
    contact_designation: c.contact_designation ?? '',
    contact_email: c.contact_email ?? '',
    contact_phone: c.contact_phone ?? '',
    website: c.website ?? '',
    workforce_count: c.workforce_count?.toString() ?? '',
    turnover_range_code: c.turnover_range_code ?? '',
    exact_turnover_lakhs: c.exact_turnover_lakhs?.toString() ?? '',
    is_mnc: c.is_mnc,
    gst_number: c.gst_number ?? '',
    cin: c.cin ?? '',
    udyam_number: c.udyam_number ?? '',
    pan: c.pan ?? '',
  }
}

export function formToPayload(
  v: CompanyFormValues,
  options?: { omitFields?: ReadonlySet<string> },
): CompanyCreate {
  const blank = (s: string) => (s.trim() === '' ? null : s.trim())
  const num = (s: string) => (s.trim() === '' ? null : Number(s))
  const payload: CompanyCreate = {
    name: v.name.trim(),
    legal_structure_code: blank(v.legal_structure_code),
    primary_place_of_business: blank(v.primary_place_of_business),
    business_activity: (blank(v.business_activity) as CompanyCreate['business_activity']) ?? null,
    address_line1: blank(v.address_line1),
    address_line2: blank(v.address_line2),
    city: blank(v.city),
    district_code: blank(v.district_code),
    taluk_code: blank(v.taluk_code),
    pincode: blank(v.pincode),
    state: v.state.trim() || 'Tamil Nadu',
    sector_code: blank(v.sector_code),
    contact_name: blank(v.contact_name),
    contact_designation: blank(v.contact_designation),
    contact_email: blank(v.contact_email),
    contact_phone: blank(v.contact_phone),
    website: blank(v.website),
    workforce_count: num(v.workforce_count),
    turnover_range_code: blank(v.turnover_range_code),
    exact_turnover_lakhs: num(v.exact_turnover_lakhs),
    is_mnc: v.is_mnc,
    gst_number: blank(v.gst_number),
    cin: blank(v.cin),
    udyam_number: blank(v.udyam_number),
    pan: blank(v.pan),
  }
  if (options?.omitFields) {
    for (const field of options.omitFields) {
      delete (payload as unknown as Record<string, unknown>)[field]
    }
  }
  return payload
}

interface CompanyFormProps {
  values: CompanyFormValues
  onChange: (v: CompanyFormValues) => void
  districts: MasterEntry[]
  sectors: MasterEntry[]
  legalStructures: MasterEntry[]
  turnoverRanges: MasterEntry[]
  lockedFields?: Set<string>
  readOnly?: boolean
}

function LockIcon() {
  return (
    <Lock
      className="inline h-3.5 w-3.5 ml-1 text-muted-soft align-middle"
      strokeWidth={2}
      aria-label="Verified from government records — read-only"
    />
  )
}

export function CompanyForm({
  values,
  onChange,
  districts,
  sectors,
  legalStructures,
  turnoverRanges,
  lockedFields,
  readOnly = false,
}: CompanyFormProps) {
  const [talukIndex, setTalukIndex] = useState<TalukIndex | null>(null)

  useEffect(() => {
    loadTalukIndex()
      .then(setTalukIndex)
      .catch(() => setTalukIndex(null))
  }, [])

  const taluks = useMemo(() => {
    if (!talukIndex || !values.district_code) return []
    return talukIndex.districts[values.district_code]?.taluks ?? []
  }, [talukIndex, values.district_code])

  const isLocked = (f: keyof CompanyFormValues) => lockedFields?.has(f as string) ?? false
  function set<K extends keyof CompanyFormValues>(key: K, value: CompanyFormValues[K]) {
    onChange({ ...values, [key]: value })
  }

  const inputCls =
    inputClassName + ' disabled:bg-surface-soft disabled:text-muted'

  return (
    <div className="space-y-8">
      <Section title="1. Basic Details">
        <Field label="Company Name" required locked={isLocked('name')}>
          <input
            type="text"
            required
            disabled={readOnly || isLocked('name')}
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Legal Constitution" locked={isLocked('legal_structure_code')}>
          <select
            disabled={readOnly || isLocked('legal_structure_code')}
            value={values.legal_structure_code}
            onChange={(e) => set('legal_structure_code', e.target.value)}
            className={inputCls}
          >
            <option value="">Select…</option>
            {legalStructures.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Primary Place of Business" locked={isLocked('primary_place_of_business')}>
          <input
            type="text"
            disabled={readOnly || isLocked('primary_place_of_business')}
            value={values.primary_place_of_business}
            onChange={(e) => set('primary_place_of_business', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Business Activity">
          <select
            disabled={readOnly}
            value={values.business_activity}
            onChange={(e) => set('business_activity', e.target.value)}
            className={inputCls}
          >
            <option value="">Select…</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="service">Service</option>
            <option value="trade">Trade</option>
          </select>
        </Field>

        <Field label="Address Line 1">
          <input
            type="text"
            disabled={readOnly}
            value={values.address_line1}
            onChange={(e) => set('address_line1', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Address Line 2">
          <input
            type="text"
            disabled={readOnly}
            value={values.address_line2}
            onChange={(e) => set('address_line2', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="City">
          <input
            type="text"
            disabled={readOnly}
            value={values.city}
            onChange={(e) => set('city', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="District">
          <select
            disabled={readOnly}
            value={values.district_code}
            onChange={(e) =>
              onChange({ ...values, district_code: e.target.value, taluk_code: '' })
            }
            className={inputCls}
          >
            <option value="">Select…</option>
            {districts.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Taluk">
          <select
            disabled={readOnly || !values.district_code}
            value={values.taluk_code}
            onChange={(e) => set('taluk_code', e.target.value)}
            className={inputCls}
          >
            <option value="">
              {!values.district_code
                ? 'Select district first…'
                : taluks.length === 0
                  ? 'No taluks available'
                  : 'Select…'}
            </option>
            {taluks.map((t) => (
              <option key={t.code} value={t.code}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Pincode">
          <input
            type="text"
            disabled={readOnly}
            value={values.pincode}
            onChange={(e) => set('pincode', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="State">
          <input
            type="text"
            disabled={readOnly}
            value={values.state}
            onChange={(e) => set('state', e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="Sector">
          <select
            disabled={readOnly}
            value={values.sector_code}
            onChange={(e) => set('sector_code', e.target.value)}
            className={inputCls}
          >
            <option value="">Select…</option>
            {sectors.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Contact Person">
          <input
            type="text"
            disabled={readOnly}
            value={values.contact_name}
            onChange={(e) => set('contact_name', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Designation">
          <input
            type="text"
            disabled={readOnly}
            value={values.contact_designation}
            onChange={(e) => set('contact_designation', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Contact Email">
          <input
            type="email"
            disabled={readOnly}
            value={values.contact_email}
            onChange={(e) => set('contact_email', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Contact Phone">
          <input
            type="tel"
            disabled={readOnly}
            value={values.contact_phone}
            onChange={(e) => set('contact_phone', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Website">
          <input
            type="url"
            disabled={readOnly}
            value={values.website}
            onChange={(e) => set('website', e.target.value)}
            className={inputCls}
            placeholder="https://"
          />
        </Field>

        <Field label="Total Workforce">
          <input
            type="number"
            min={0}
            disabled={readOnly}
            value={values.workforce_count}
            onChange={(e) => set('workforce_count', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Turnover Range">
          <select
            disabled={readOnly}
            value={values.turnover_range_code}
            onChange={(e) => set('turnover_range_code', e.target.value)}
            className={inputCls}
          >
            <option value="">Select…</option>
            {turnoverRanges.map((t) => (
              <option key={t.code} value={t.code}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Exact Turnover (₹ Lakhs)">
          <input
            type="number"
            min={0}
            step="0.01"
            disabled={readOnly}
            value={values.exact_turnover_lakhs}
            onChange={(e) => set('exact_turnover_lakhs', e.target.value)}
            className={inputCls}
            placeholder="optional"
          />
        </Field>
        <Field label="MNC">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700 mt-2">
            <input
              type="checkbox"
              disabled={readOnly}
              checked={values.is_mnc}
              onChange={(e) => set('is_mnc', e.target.checked)}
            />
            This is a multinational company
          </label>
        </Field>
      </Section>

      <Section title="2. Registration">
        <Field label="GST Number" locked={isLocked('gst_number')}>
          <input
            type="text"
            disabled={readOnly || isLocked('gst_number')}
            value={values.gst_number}
            onChange={(e) => set('gst_number', e.target.value.toUpperCase())}
            className={inputCls + ' font-mono'}
          />
        </Field>
        <Field label="CIN" locked={isLocked('cin')}>
          <input
            type="text"
            disabled={readOnly || isLocked('cin')}
            value={values.cin}
            onChange={(e) => set('cin', e.target.value.toUpperCase())}
            className={inputCls + ' font-mono'}
          />
        </Field>
        <Field label="Udyam Number" locked={isLocked('udyam_number')}>
          <input
            type="text"
            disabled={readOnly || isLocked('udyam_number')}
            value={values.udyam_number}
            onChange={(e) => set('udyam_number', e.target.value.toUpperCase())}
            className={inputCls + ' font-mono'}
          />
        </Field>
        <Field label="PAN">
          <input
            type="text"
            disabled={readOnly}
            value={values.pan}
            onChange={(e) => set('pan', e.target.value.toUpperCase())}
            className={inputCls + ' font-mono'}
          />
        </Field>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-200">
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  )
}

function Field({
  label,
  required,
  locked,
  children,
}: {
  label: string
  required?: boolean
  locked?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {locked && <LockIcon />}
      </label>
      {children}
    </div>
  )
}
