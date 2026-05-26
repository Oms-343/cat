import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import type { EnrollInvite } from '../api/enroll'
import { fetchMasterOptions } from '../api/enroll'
import { taluksForDistrict } from '../lib/talukIndex'
import {
  formToTab1Payload,
  prefillToForm,
  validateTab1Client,
  type Tab1FormValues,
} from '../lib/tab1Form'

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500'

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 border-t border-slate-200 pt-6 first:border-t-0 first:pt-0">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

export function Tab1CompanyForm({
  invite,
  onSubmit,
  submitting,
}: {
  invite: EnrollInvite
  onSubmit: (payload: ReturnType<typeof formToTab1Payload>) => void
  submitting: boolean
}) {
  const [form, setForm] = useState<Tab1FormValues>(() =>
    prefillToForm(invite.prefill, invite.recipient_name),
  )
  const [districts, setDistricts] = useState<{ code: string; name: string }[]>([])
  const [sectors, setSectors] = useState<{ code: string; name: string }[]>([])
  const [turnovers, setTurnovers] = useState<{ code: string; name: string }[]>([])
  const [legalStructures, setLegalStructures] = useState<{ code: string; name: string }[]>([])
  const [clientError, setClientError] = useState<string | null>(null)

  const taluks = useMemo(
    () => taluksForDistrict(form.district_code),
    [form.district_code],
  )

  useEffect(() => {
    void Promise.all([
      fetchMasterOptions('districts'),
      fetchMasterOptions('sectors'),
      fetchMasterOptions('turnover-ranges'),
      fetchMasterOptions('legal-structures'),
    ]).then(([d, s, t, l]) => {
      setDistricts(d)
      setSectors(s)
      setTurnovers(t)
      setLegalStructures(l)
    })
  }, [])

  function set<K extends keyof Tab1FormValues>(key: K, value: Tab1FormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const missing = validateTab1Client(form)
    if (missing.length) {
      setClientError(`Please fill: ${missing.join(', ')}`)
      return
    }
    setClientError(null)
    onSubmit(formToTab1Payload(form))
  }

  const phoneLocked = !!invite.prefill.phone

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-600">
        Complete all required fields in <strong>Basic details</strong> and{' '}
        <strong>Registration</strong> to save Tab 1. Tab 2 is optional.
      </p>

      <Section title="1. Basic details">
        <div className="sm:col-span-2">
          <Field label="Company name" required>
            <input className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </Field>
        </div>
        <Field label="Legal constitution">
          <select className={inputClass} value={form.legal_structure_code} onChange={(e) => set('legal_structure_code', e.target.value)}>
            <option value="">Select…</option>
            {legalStructures.map((l) => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Primary place of business">
          <input className={inputClass} value={form.primary_place_of_business} onChange={(e) => set('primary_place_of_business', e.target.value)} />
        </Field>
        <Field label="Business activity" required>
          <select className={inputClass} value={form.business_activity} onChange={(e) => set('business_activity', e.target.value)} required>
            <option value="">Select…</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="service">Service</option>
            <option value="trade">Trade</option>
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Address line 1" required>
            <input className={inputClass} value={form.address_line1} onChange={(e) => set('address_line1', e.target.value)} required />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Address line 2">
            <input className={inputClass} value={form.address_line2} onChange={(e) => set('address_line2', e.target.value)} />
          </Field>
        </div>
        <Field label="City" required>
          <input className={inputClass} value={form.city} onChange={(e) => set('city', e.target.value)} required />
        </Field>
        <Field label="District" required>
          <select
            className={inputClass}
            value={form.district_code}
            onChange={(e) => setForm((f) => ({ ...f, district_code: e.target.value, taluk_code: '' }))}
            required
          >
            <option value="">Select district</option>
            {districts.map((d) => (
              <option key={d.code} value={d.code}>{d.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Taluk">
          <select className={inputClass} value={form.taluk_code} onChange={(e) => set('taluk_code', e.target.value)} disabled={!form.district_code}>
            <option value="">
              {!form.district_code
                ? 'Select district first'
                : taluks.length === 0
                  ? 'No taluks available'
                  : 'Select taluk'}
            </option>
            {taluks.map((t) => (
              <option key={t.code} value={t.code}>{t.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Pincode" required>
          <input className={inputClass} value={form.pincode} onChange={(e) => set('pincode', e.target.value)} required />
        </Field>
        <Field label="State">
          <input className={inputClass} value={form.state} onChange={(e) => set('state', e.target.value)} />
        </Field>
        <Field label="Sector" required>
          <select className={inputClass} value={form.sector_code} onChange={(e) => set('sector_code', e.target.value)} required>
            <option value="">Select sector</option>
            {sectors.map((s) => (
              <option key={s.code} value={s.code}>{s.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Contact name" required>
          <input className={inputClass} value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} required />
        </Field>
        <Field label="Contact designation">
          <input className={inputClass} value={form.contact_designation} onChange={(e) => set('contact_designation', e.target.value)} />
        </Field>
        <Field label="Contact email" required>
          <input type="email" className={inputClass} value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} required />
        </Field>
        <Field label="Contact phone" required>
          <input className={inputClass} value={form.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} required readOnly={phoneLocked} />
        </Field>
        <Field label="Website">
          <input type="url" className={inputClass} value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://" />
        </Field>
        <Field label="Workforce count" required>
          <input type="number" min={0} className={inputClass} value={form.workforce_count} onChange={(e) => set('workforce_count', e.target.value)} required />
        </Field>
        <Field label="Turnover range" required>
          <select className={inputClass} value={form.turnover_range_code} onChange={(e) => set('turnover_range_code', e.target.value)} required>
            <option value="">Select range</option>
            {turnovers.map((t) => (
              <option key={t.code} value={t.code}>{t.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Exact turnover (lakhs)">
          <input type="number" min={0} className={inputClass} value={form.exact_turnover_lakhs} onChange={(e) => set('exact_turnover_lakhs', e.target.value)} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
          <input type="checkbox" checked={form.is_mnc} onChange={(e) => set('is_mnc', e.target.checked)} />
          Multinational company (MNC)
        </label>
      </Section>

      <Section title="2. Registration">
        <Field label="GSTIN" required>
          <input className={inputClass} value={form.gst_number} onChange={(e) => set('gst_number', e.target.value)} required />
        </Field>
        <Field label="CIN" required>
          <input className={inputClass} value={form.cin} onChange={(e) => set('cin', e.target.value)} required />
        </Field>
        <Field label="Udyam number" required>
          <input className={inputClass} value={form.udyam_number} onChange={(e) => set('udyam_number', e.target.value)} required />
        </Field>
        <Field label="PAN" required>
          <input className={inputClass} value={form.pan} onChange={(e) => set('pan', e.target.value)} required />
        </Field>
      </Section>

      {clientError ? <p className="text-sm text-red-700">{clientError}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-teal-700 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
      >
        {submitting ? 'Saving…' : 'Save Tab 1 — core details'}
      </button>
    </form>
  )
}
