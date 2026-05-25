import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createCompany } from '../api/companies'
import { listEntries } from '../api/masters'
import { ApiError } from '../api/client'
import {
  CompanyForm,
  emptyCompanyForm,
  formToPayload,
  type CompanyFormValues,
} from '../components/CompanyForm'
import type { MasterEntry } from '../types/master'

export function CompanyAddPage() {
  const navigate = useNavigate()

  const [values, setValues] = useState<CompanyFormValues>(emptyCompanyForm)
  const [masters, setMasters] = useState<{
    districts: MasterEntry[]
    sectors: MasterEntry[]
    legalStructures: MasterEntry[]
    turnoverRanges: MasterEntry[]
  } | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      listEntries('districts', { active: true }),
      listEntries('sectors', { active: true }),
      listEntries('legal-structures', { active: true }),
      listEntries('turnover-ranges', { active: true }),
    ])
      .then(([districts, sectors, legalStructures, turnoverRanges]) =>
        setMasters({ districts, sectors, legalStructures, turnoverRanges }),
      )
      .catch((err) => {
        if (err instanceof ApiError) setError(`Masters load: ${err.detail}`)
        else setError(String(err))
      })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!values.name.trim()) {
      setError('Company name is required')
      return
    }
    setSaving(true)
    try {
      const c = await createCompany(formToPayload(values))
      navigate(`/companies/${c.id}`)
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail)
      else setError(String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-sm text-blue-600 hover:underline"
      >
        ← Back
      </button>

      <header className="mt-2 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Add MSME</h1>
        <p className="text-sm text-slate-500">
          Create a new company profile. Fields can be updated later — only the name is required to start.
        </p>
      </header>

      {!masters && <p className="text-sm text-slate-500">Loading…</p>}

      {masters && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6">
          <CompanyForm
            values={values}
            onChange={setValues}
            districts={masters.districts}
            sectors={masters.sectors}
            legalStructures={masters.legalStructures}
            turnoverRanges={masters.turnoverRanges}
          />

          <div className="mt-6 pt-6 border-t border-slate-200 flex items-center justify-end gap-3">
            {error && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-1.5 mr-auto">
                {error}
              </p>
            )}
            <Link
              to="/companies"
              className="text-sm border border-slate-300 px-3 py-1.5 rounded-md hover:bg-slate-100"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium px-4 py-1.5 rounded-md"
            >
              {saving ? 'Creating…' : 'Create company'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
