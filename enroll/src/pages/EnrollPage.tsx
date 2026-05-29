import { useCallback, useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { fetchInvite, submitTab1 } from '../api/enroll'
import { Tab1CompanyForm } from '../components/Tab1CompanyForm'
import { Tab2Sections } from '../components/Tab2Sections'
import { EnrollLayout } from '../components/EnrollLayout'
import { DEMO_INVITE, isDemoToken } from '../lib/demoInvite'

type Tab = '1' | '2'

export function EnrollPage() {
  const { token } = useParams<{ token: string }>()
  const isDemo = isDemoToken(token)
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(!isDemo)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [invite, setInvite] = useState<Awaited<ReturnType<typeof fetchInvite>> | null>(null)
  const [tab, setTab] = useState<Tab>('1')

  const reload = useCallback(async () => {
    if (!token) return
    if (isDemoToken(token)) {
      setInvite(DEMO_INVITE)
      return
    }
    const data = await fetchInvite(token)
    setInvite(data)
    if (data.can_access_tab2 && searchParams.get('tab') === '2') {
      setTab('2')
    } else if (data.tab1_complete && !data.can_submit_tab1) {
      setTab('2')
    }
  }, [token, searchParams])

  useEffect(() => {
    if (!token) return
    if (isDemo) {
      setInvite(DEMO_INVITE)
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    fetchInvite(token)
      .then((data) => {
        setInvite(data)
        if (data.can_access_tab2 && searchParams.get('tab') === '2') setTab('2')
        else if (data.tab1_complete) setTab('2')
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token, searchParams, isDemo])

  async function handleTab1Submit(payload: Parameters<typeof submitTab1>[1]) {
    if (!token) return
    if (isDemo) {
      setError('Preview only — open your personal WhatsApp invitation link to save your profile.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await submitTab1(token, payload)
      await reload()
      setTab('2')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) {
    return (
      <EnrollLayout title="Invalid link">
        <p className="text-red-600">Missing enrollment token.</p>
      </EnrollLayout>
    )
  }

  if (loading) {
    return (
      <EnrollLayout title="Loading…">
        <p className="text-slate-600">Please wait.</p>
      </EnrollLayout>
    )
  }

  if (error && !invite) {
    return (
      <EnrollLayout title="Link unavailable">
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      </EnrollLayout>
    )
  }

  if (!invite) return null

  const pct = invite.profile_completion ?? 0

  return (
    <EnrollLayout
      title={`${invite.recipient_name}`}
      subtitle="Tamil Nadu MSME Platform — complete your business profile via this secure link."
    >
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <span>
          Profile completion: <strong>{pct}%</strong>
        </span>
        {invite.section_completion ? (
          <span className="text-xs text-slate-500">
            {Object.entries(invite.section_completion)
              .filter(([, ok]) => !ok)
              .map(([k]) => k.replace('_', ' '))
              .join(' · ') || 'All sections complete'}
            {!Object.values(invite.section_completion).every(Boolean) ? ' pending' : ''}
          </span>
        ) : null}
      </div>

      <div className="mb-6 flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab('1')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === '1' ? 'border-teal-700 text-teal-800' : 'border-transparent text-slate-500'
          }`}
        >
          Tab 1 — Basic & registration
          {invite.tab1_complete ? ' ✓' : ''}
        </button>
        <button
          type="button"
          onClick={() => invite.can_access_tab2 && setTab('2')}
          disabled={!invite.can_access_tab2}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px disabled:opacity-40 ${
            tab === '2' ? 'border-teal-700 text-teal-800' : 'border-transparent text-slate-500'
          }`}
        >
          Tab 2 — Optional details
        </button>
      </div>

      {isDemo ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Preview form — not connected to a live invitation. Use the link from your WhatsApp message to
          register and save.
        </p>
      ) : null}

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}

      {tab === '1' ? (
        invite.can_submit_tab1 ? (
          <Tab1CompanyForm invite={invite} onSubmit={handleTab1Submit} submitting={submitting} />
        ) : invite.tab1_complete ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
            <p>Tab 1 is complete. Use Tab 2 to add products, certifications, and other optional details.</p>
            <button type="button" onClick={() => setTab('2')} className="mt-4 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white">
              Go to Tab 2
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-600">This link is no longer available for editing Tab 1.</p>
        )
      ) : invite.can_access_tab2 ? (
        <>
          <Tab2Sections
            token={token}
            initialTags={invite.prefill.tags ?? []}
            onRefresh={() => void reload()}
          />
          <div className="mt-6">
            <Link
              to={`/enroll/${token}/success`}
              className="inline-block rounded-lg bg-teal-700 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-800"
            >
              Finish for now
            </Link>
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-600">Complete Tab 1 before adding optional profile sections.</p>
      )}
    </EnrollLayout>
  )
}
