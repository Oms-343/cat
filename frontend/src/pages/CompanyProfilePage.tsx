import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createEditRequest } from '../api/editRequests'
import { deleteCompany, getCompany, getLockedFields, updateCompany } from '../api/companies'
import { uploadImage } from '../api/uploads'
import { listEntries } from '../api/masters'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import {
  CompanyForm,
  companyToForm,
  formToPayload,
  type CompanyFormValues,
} from '../components/CompanyForm'
import {
  CertificationsSection,
  CustomersSection,
  MachinerySection,
  ProductsSection,
} from '../components/ProfileSubSections'
import { CompanyLocationMap } from '../components/maps/CompanyLocationMap'
import type { Company, LockedFields } from '../types/company'
import type { MasterEntry } from '../types/master'

const SECTION_LABELS: { key: string; label: string }[] = [
  { key: 'basic_details', label: 'Basic Details' },
  { key: 'registration', label: 'Registration' },
  { key: 'products', label: 'Products / Services' },
  { key: 'certifications', label: 'Certifications' },
  { key: 'customers', label: 'Customers' },
  { key: 'machinery', label: 'Machinery / Services' },
  { key: 'tags', label: 'Tags' },
]

const SUGGESTED_TAGS = ['Defence', 'Aerospace', 'EV', 'Forging', 'Export', 'GreenTech']

export function CompanyProfilePage() {
  const { id } = useParams<{ id: string }>()
  const companyId = Number(id)
  const { user } = useAuth()
  const navigate = useNavigate()

  const [company, setCompany] = useState<Company | null>(null)
  const [locked, setLocked] = useState<LockedFields | null>(null)
  const [masters, setMasters] = useState<{
    districts: MasterEntry[]
    sectors: MasterEntry[]
    legalStructures: MasterEntry[]
    turnoverRanges: MasterEntry[]
    certifications: MasterEntry[]
    productionCapacities: MasterEntry[]
  } | null>(null)

  const [editing, setEditing] = useState(false)
  const [formValues, setFormValues] = useState<CompanyFormValues | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [editedTags, setEditedTags] = useState<string[] | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function refreshCompletion() {
    getCompany(companyId)
      .then(setCompany)
      .catch(() => {
        /* non-fatal — completion will be stale */
      })
  }

  function load() {
    setLoading(true)
    Promise.all([
      getCompany(companyId),
      getLockedFields(),
      listEntries('districts', { active: true }),
      listEntries('sectors', { active: true }),
      listEntries('legal-structures', { active: true }),
      listEntries('turnover-ranges', { active: true }),
      listEntries('certifications', { active: true }),
      listEntries('production-capacities', { active: true }),
    ])
      .then(([c, lf, districts, sectors, legalStructures, turnoverRanges, certifications, productionCapacities]) => {
        setCompany(c)
        setLocked(lf)
        setMasters({ districts, sectors, legalStructures, turnoverRanges, certifications, productionCapacities })
        setFormValues(companyToForm(c))
        setEditedTags(c.tags)
        setError(null)
      })
      .catch((err) => {
        if (err instanceof ApiError) setError(`${err.status}: ${err.detail}`)
        else setError(String(err))
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (Number.isFinite(companyId)) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId])

  if (loading) {
    return <p className="p-8 text-sm text-slate-500">Loading…</p>
  }

  if (error || !company || !masters || !locked || !formValues) {
    const isMsmeUser = user?.role === 'msme'
    return (
      <div className="p-8">
        {!isMsmeUser && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back
          </button>
        )}
        <p className={`text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3 ${isMsmeUser ? '' : 'mt-4'}`}>
          {error ?? 'Failed to load profile'}
        </p>
      </div>
    )
  }

  const isMsme = user?.role === 'msme'
  const canEditAnything = !isMsme || company.owner_user_id === user?.id
  const canEditTags = user ? locked.tag_edit_roles.includes(user.role) : false
  const canDelete = user?.role === 'super'
  const lockedFieldsSet = isMsme ? new Set(locked.locked_for_msme) : undefined

  async function handleSave() {
    if (!formValues) return
    setSaveError(null)
    setSaving(true)
    try {
      const payload = formToPayload(formValues, { omitFields: lockedFieldsSet })
      if (canEditTags && editedTags) {
        ;(payload as { tags?: string[] }).tags = editedTags
      }
      const updated = await updateCompany(companyId, payload)
      setCompany(updated)
      setFormValues(companyToForm(updated))
      setEditedTags(updated.tags)
      setEditing(false)
    } catch (err) {
      if (err instanceof ApiError) setSaveError(err.detail)
      else setSaveError(String(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!company) return
    if (!confirm(`Delete ${company.name}? This cannot be undone.`)) return
    try {
      await deleteCompany(companyId)
      navigate(user?.role === 'msme' ? '/my-profile' : '/companies')
    } catch (err) {
      if (err instanceof ApiError) alert(err.detail)
      else alert(String(err))
    }
  }

  function addTag(t: string) {
    const v = t.trim()
    if (!v || (editedTags ?? []).includes(v)) return
    setEditedTags([...(editedTags ?? []), v])
    setTagInput('')
  }

  function removeTag(t: string) {
    setEditedTags((editedTags ?? []).filter((x) => x !== t))
  }

  function completionColor(pct: number): string {
    if (pct >= 90) return 'bg-green-100 text-green-800 border-green-200'
    if (pct >= 70) return 'bg-amber-100 text-amber-800 border-amber-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      {!isMsme && (
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back
        </button>
      )}

      <header className={`${isMsme ? '' : 'mt-2'} mb-6 flex items-start justify-between gap-4`}>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 truncate">{company.name}</h1>
          <p className="text-sm text-slate-500">
            {company.gst_number ?? 'No GST'} ·{' '}
            {masters.sectors.find((s) => s.code === company.sector_code)?.name ??
              company.sector_code ??
              'Unspecified sector'}{' '}
            ·{' '}
            {masters.districts.find((d) => d.code === company.district_code)?.name ??
              company.district_code ??
              'No district'}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`text-sm font-semibold px-3 py-1 rounded border ${completionColor(company.profile_completion)}`}
          >
            {company.profile_completion}% complete
          </span>
          {canEditAnything && !editing && (
            <>
              <label className="text-sm border border-slate-300 px-3 py-1.5 rounded-md hover:bg-slate-100 cursor-pointer">
                Logo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    try {
                      const { url } = await uploadImage(f)
                      const updated = await updateCompany(companyId, { logo_url: url })
                      setCompany(updated)
                    } catch (err) {
                      alert(err instanceof Error ? err.message : String(err))
                    }
                  }}
                />
              </label>
              <button
                onClick={() => setEditing(true)}
                className="text-sm border border-slate-300 px-3 py-1.5 rounded-md hover:bg-slate-100"
              >
                Edit
              </button>
            </>
          )}
          {isMsme && canEditAnything && !editing && (
            <button
              type="button"
              className="text-sm border border-amber-300 text-amber-800 px-3 py-1.5 rounded-md hover:bg-amber-50"
              onClick={async () => {
                const val = prompt('Request change to company name (govt locked field):')
                if (!val?.trim()) return
                try {
                  await createEditRequest(companyId, { name: val.trim() })
                  alert('Change request submitted for TIDCO approval.')
                } catch (err) {
                  alert(err instanceof ApiError ? err.detail : String(err))
                }
              }}
            >
              Request name change
            </button>
          )}
          {canDelete && !editing && (
            <button
              onClick={handleDelete}
              className="text-sm border border-red-300 text-red-700 px-3 py-1.5 rounded-md hover:bg-red-50"
            >
              Delete
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-xl p-4 sticky top-4">
            <h3 className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-3">
              Profile Sections
            </h3>
            <ul className="space-y-2 text-sm">
              {SECTION_LABELS.map((s) => {
                const done = company.section_completion[s.key]
                return (
                  <li key={s.key} className="flex items-center justify-between">
                    <span className="text-slate-700">{s.label}</span>
                    {done ? (
                      <span className="text-green-600 text-xs">✓ Complete</span>
                    ) : (
                      <span className="text-slate-400 text-xs">⬜ Pending</span>
                    )}
                  </li>
                )
              })}
            </ul>
            {isMsme && (
              <p className="mt-4 text-xs text-slate-500">
                Some fields are <strong>🔒 locked</strong> — they come from verified government
                records and can't be edited.
              </p>
            )}
          </div>
        </aside>

        <main className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-6">
          <CompanyForm
            values={formValues}
            onChange={setFormValues}
            districts={masters.districts}
            sectors={masters.sectors}
            legalStructures={masters.legalStructures}
            turnoverRanges={masters.turnoverRanges}
            lockedFields={lockedFieldsSet}
            readOnly={!editing}
          />

          <div className="mt-8 pt-6 border-t border-slate-200">
            <CompanyLocationMap
              name={company.name}
              addressLine1={company.address_line1}
              addressLine2={company.address_line2}
              city={company.city}
              districtCode={company.district_code}
              districtName={
                masters.districts.find((d) => d.code === company.district_code)?.name ?? undefined
              }
              pincode={company.pincode}
              state={company.state}
            />
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 space-y-0">
            <ProductsSection
              companyId={companyId}
              canEdit={canEditAnything}
              onChange={refreshCompletion}
            />
            <CertificationsSection
              companyId={companyId}
              canEdit={canEditAnything}
              certifications={masters.certifications}
              onChange={refreshCompletion}
            />
            <CustomersSection
              companyId={companyId}
              canEdit={canEditAnything}
              onChange={refreshCompletion}
            />
            <MachinerySection
              companyId={companyId}
              canEdit={canEditAnything}
              productionCapacities={masters.productionCapacities}
              onChange={refreshCompletion}
            />
          </div>

          <div className="mt-2 pt-6 border-t border-slate-200">
            <h3 className="text-base font-semibold text-slate-900 mb-3">
              7. Tags
              {!canEditTags && <span className="ml-2 text-xs font-normal text-slate-500">(TIDCO-only edits)</span>}
            </h3>

            <div className="flex flex-wrap gap-2 mb-3">
              {(editing && canEditTags ? editedTags ?? [] : company.tags).map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded border bg-blue-50 text-blue-800 border-blue-200"
                >
                  {t}
                  {editing && canEditTags && (
                    <button
                      onClick={() => removeTag(t)}
                      className="text-blue-700 hover:text-blue-900"
                      type="button"
                    >
                      ✕
                    </button>
                  )}
                </span>
              ))}
              {company.tags.length === 0 && !editing && (
                <span className="text-sm text-slate-400">No tags yet</span>
              )}
            </div>

            {editing && canEditTags && (
              <div>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag(tagInput)
                      }
                    }}
                    placeholder="Type a tag and press Enter"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => addTag(tagInput)}
                    className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-slate-500">Suggested:</span>
                  {SUGGESTED_TAGS.filter((t) => !(editedTags ?? []).includes(t)).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => addTag(t)}
                      className="text-xs px-2 py-0.5 rounded border bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                    >
                      + {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {editing && (
            <div className="mt-6 pt-6 border-t border-slate-200 flex items-center justify-end gap-3">
              {saveError && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-1.5 mr-auto">
                  {saveError}
                </p>
              )}
              <button
                onClick={() => {
                  setFormValues(companyToForm(company))
                  setEditedTags(company.tags)
                  setEditing(false)
                  setSaveError(null)
                }}
                className="text-sm border border-slate-300 px-3 py-1.5 rounded-md hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium px-4 py-1.5 rounded-md"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
