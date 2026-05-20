import { useState } from 'react'
import { Modal } from '../components/Modal'

interface WhatsAppTemplate {
  id: string
  name: string
  purpose: string
  status: 'approved'
  languages: ('en' | 'ta')[]
  previewEn: string
  previewTa: string
}

interface Campaign {
  id: string
  name: string
  templateId: string
  sent: number
  deliveredPct: number
  responded: number
  status: 'completed' | 'running' | 'draft'
  launchedAt: string
  audience: string
}

const TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'profile_completion_invite_v2',
    name: 'Profile completion invite',
    purpose: 'Invite registered MSMEs to complete their platform profile',
    status: 'approved',
    languages: ['en', 'ta'],
    previewEn:
      'Dear {{name}}, TIDCO invites you to complete your MSME profile on the Tamil Nadu MSME Platform. Tap the link to update your details: {{link}}',
    previewTa:
      'அன்புள்ள {{name}}, தமிழ்நாடு MSME தளத்தில் உங்கள் சுயவிவரத்தை முழுமையாக்க TIDCO அழைக்கிறது. இணைப்பைத் தட்டவும்: {{link}}',
  },
  {
    id: 'onboarding_reminder_v1',
    name: 'Onboarding reminder',
    purpose: 'Remind unregistered businesses to sign up via the platform',
    status: 'approved',
    languages: ['en', 'ta'],
    previewEn:
      'You are invited to register your MSME on the official Tamil Nadu MSME Platform. Sign up in minutes with your email: {{link}}',
    previewTa:
      'உங்கள் MSME-ஐ அதிகாரப்பூர்வ தமிழ்நாடு MSME தளத்தில் பதிவு செய்ய அழைக்கப்படுகிறீர்கள். மின்னஞ்சலுடன் நிமிடங்களில் பதிவு செய்யுங்கள்: {{link}}',
  },
  {
    id: 'document_request_v3',
    name: 'Document request',
    purpose: 'Request specific documents or certifications from MSMEs',
    status: 'approved',
    languages: ['en', 'ta'],
    previewEn:
      'TIDCO requests the following documents for {{company}}: {{doc_list}}. Upload securely here: {{link}}',
    previewTa:
      'TIDCO {{company}} க்கான பின்வரும் ஆவணங்களை கோருகிறது: {{doc_list}}. பாதுகாப்பாக பதிவேற்றம்: {{link}}',
  },
]

const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-1',
    name: 'Coimbatore textile drive',
    templateId: 'onboarding_reminder_v1',
    sent: 8210,
    deliveredPct: 94,
    responded: 2140,
    status: 'completed',
    launchedAt: '2026-04-12',
    audience: 'Coimbatore · Textile & Apparel · Unregistered',
  },
  {
    id: 'camp-2',
    name: 'Madurai food sector outreach',
    templateId: 'onboarding_reminder_v1',
    sent: 3420,
    deliveredPct: 96,
    responded: 812,
    status: 'completed',
    launchedAt: '2026-03-28',
    audience: 'Madurai · Food processing',
  },
  {
    id: 'camp-3',
    name: 'Defence-tagged MSMEs survey',
    templateId: 'document_request_v3',
    sent: 240,
    deliveredPct: 99,
    responded: 186,
    status: 'completed',
    launchedAt: '2026-05-02',
    audience: 'Statewide · Tag: Defence',
  },
]

const DISTRICTS = [
  'Coimbatore',
  'Madurai',
  'Chennai',
  'Tiruppur',
  'Salem',
  'Erode',
  'All districts',
]

const SECTORS = [
  'Textile & Apparel',
  'Food processing',
  'Automotive',
  'IT & Software',
  'Defence supply chain',
  'All sectors',
]

function responseRate(c: Campaign): number {
  if (c.sent === 0) return 0
  return Math.round((c.responded / c.sent) * 100)
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-IN')
}

export function OnboardingDrivesPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [selectedTemplateId, setSelectedTemplateId] = useState(TEMPLATES[0].id)
  const [campaignName, setCampaignName] = useState('')
  const [district, setDistrict] = useState(DISTRICTS[0])
  const [sector, setSector] = useState(SECTORS[0])
  const [registrationFilter, setRegistrationFilter] = useState<'unregistered' | 'incomplete' | 'all'>(
    'unregistered',
  )
  const [launching, setLaunching] = useState(false)
  const [launchMessage, setLaunchMessage] = useState<string | null>(null)

  const selectedTemplate = TEMPLATES.find((t) => t.id === selectedTemplateId) ?? TEMPLATES[0]

  const totalSent = campaigns.reduce((s, c) => s + c.sent, 0)
  const totalResponded = campaigns.reduce((s, c) => s + c.responded, 0)
  const avgDelivery =
    campaigns.length === 0
      ? 0
      : Math.round(campaigns.reduce((s, c) => s + c.deliveredPct, 0) / campaigns.length)

  function openWizard() {
    setStep(1)
    setSelectedTemplateId(TEMPLATES[0].id)
    setCampaignName('')
    setDistrict(DISTRICTS[0])
    setSector(SECTORS[0])
    setRegistrationFilter('unregistered')
    setWizardOpen(true)
  }

  function closeWizard() {
    setWizardOpen(false)
    setLaunching(false)
  }

  function audienceLabel(): string {
    const reg =
      registrationFilter === 'unregistered'
        ? 'Unregistered'
        : registrationFilter === 'incomplete'
          ? 'Incomplete profile'
          : 'All MSMEs'
    return `${district} · ${sector} · ${reg}`
  }

  async function handleLaunch() {
    setLaunching(true)
    await new Promise((r) => setTimeout(r, 900))
    const estimatedSent =
      district === 'All districts' ? 12000 : sector.includes('Defence') ? 240 : 4500
    const newCampaign: Campaign = {
      id: `camp-${Date.now()}`,
      name: campaignName.trim() || `${district} ${sector} drive`,
      templateId: selectedTemplateId,
      sent: estimatedSent,
      deliveredPct: 95,
      responded: Math.round(estimatedSent * 0.24),
      status: 'running',
      launchedAt: new Date().toISOString().slice(0, 10),
      audience: audienceLabel(),
    }
    setCampaigns((prev) => [newCampaign, ...prev])
    setLaunchMessage(
      `Campaign "${newCampaign.name}" queued (demo). ~${formatNumber(estimatedSent)} messages would be sent via WhatsApp Business API.`,
    )
    setLaunching(false)
    closeWizard()
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Onboarding Drives</h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            WhatsApp campaigns to invite and remind MSMEs to register or complete their profiles.
            Pre-approved bilingual templates, audience targeting, and delivery tracking.
          </p>
        </div>
        <button
          type="button"
          onClick={openWizard}
          className="text-sm font-medium bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          + New campaign
        </button>
      </header>

      <div className="mb-6 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-4 py-3">
        <strong>Preview mode.</strong> This page uses static demo data only — no messages are sent.
        Backend integration (WhatsApp Business API, audience queries) is not wired yet.
      </div>

      {launchMessage && (
        <div className="mb-6 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-4 py-3 flex justify-between gap-4">
          <span>{launchMessage}</span>
          <button
            type="button"
            onClick={() => setLaunchMessage(null)}
            className="text-emerald-600 hover:text-emerald-900 shrink-0"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Campaigns</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{campaigns.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Messages sent</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(totalSent)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Avg delivery · responses
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {avgDelivery}% · {formatNumber(totalResponded)}
          </p>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Campaign performance</h2>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Audience</th>
                <th className="px-4 py-3 text-right">Sent</th>
                <th className="px-4 py-3 text-right">Delivered</th>
                <th className="px-4 py-3 text-right">Responded</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                const rate = responseRate(c)
                const template = TEMPLATES.find((t) => t.id === c.templateId)
                return (
                  <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{c.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {template?.name ?? c.templateId} · {c.launchedAt}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs">{c.audience}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatNumber(c.sent)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{c.deliveredPct}%</td>
                    <td className="px-4 py-3 text-right">
                      <span className="tabular-nums">{formatNumber(c.responded)}</span>
                      <span
                        className={`ml-1 text-xs font-semibold ${
                          rate >= 50 ? 'text-emerald-700' : rate >= 25 ? 'text-slate-600' : 'text-amber-700'
                        }`}
                      >
                        ({rate}%)
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase ${
                          c.status === 'running'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : c.status === 'completed'
                              ? 'bg-slate-100 text-slate-700 border-slate-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Targeted campaigns (e.g. Defence-tagged) often see higher response rates than broad sector drives.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Pre-approved message templates</h2>
        <p className="text-sm text-slate-500 mb-4">
          WhatsApp requires Meta-approved templates. Only templates listed here can be used in campaigns.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TEMPLATES.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-slate-900 text-sm">{t.name}</h3>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-emerald-50 text-emerald-800 border-emerald-200 shrink-0">
                  Approved
                </span>
              </div>
              <code className="text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded mb-2 block truncate">
                {t.id}
              </code>
              <p className="text-sm text-slate-600 flex-1">{t.purpose}</p>
              <div className="mt-3 flex gap-1">
                {t.languages.map((lang) => (
                  <span
                    key={lang}
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-slate-100 text-slate-700 border-slate-200 uppercase"
                  >
                    {lang === 'en' ? 'English' : 'Tamil'}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 bg-slate-100 rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">How onboarding drives work</h2>
        <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-slate-600 list-decimal list-inside">
          <li>Select a pre-approved WhatsApp template</li>
          <li>Preview the bilingual message (Tamil & English)</li>
          <li>Define target audience by district, sector, and registration status</li>
          <li>Launch campaign — messages sent in bulk via WhatsApp Business API</li>
          <li>Track sent, delivery rate, and response count</li>
          <li>Responses can auto-populate MSME profiles on the platform</li>
        </ol>
      </section>

      <Modal
        open={wizardOpen}
        title={`New campaign — step ${step} of 4`}
        onClose={closeWizard}
        footer={
          <div className="flex justify-between w-full">
            <button
              type="button"
              onClick={() => (step > 1 ? setStep(step - 1) : closeWizard())}
              className="text-sm border border-slate-300 px-3 py-1.5 rounded-md hover:bg-white"
              disabled={launching}
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="text-sm font-medium bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLaunch}
                disabled={launching}
                className="text-sm font-medium bg-green-600 text-white px-4 py-1.5 rounded-md hover:bg-green-700 disabled:opacity-60"
              >
                {launching ? 'Launching…' : 'Launch campaign'}
              </button>
            )}
          </div>
        }
      >
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">Choose an approved template for this drive.</p>
            {TEMPLATES.map((t) => (
              <label
                key={t.id}
                className={`flex gap-3 p-3 rounded-lg border cursor-pointer ${
                  selectedTemplateId === t.id
                    ? 'border-green-500 bg-green-50/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="template"
                  checked={selectedTemplateId === t.id}
                  onChange={() => setSelectedTemplateId(t.id)}
                  className="mt-1"
                />
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 text-sm">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.id}</p>
                  <p className="text-xs text-slate-600 mt-1">{t.purpose}</p>
                </div>
              </label>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Preview how recipients will see the message (variables shown as placeholders).
            </p>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">English</p>
              <div className="text-sm bg-[#e7fce3] border border-green-200 rounded-lg p-3 text-slate-800">
                {selectedTemplate.previewEn}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">தமிழ்</p>
              <div className="text-sm bg-[#e7fce3] border border-green-200 rounded-lg p-3 text-slate-800">
                {selectedTemplate.previewTa}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Campaign name</label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. Erode textile onboarding"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">District</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              >
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Sector</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              >
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Audience</label>
              <select
                value={registrationFilter}
                onChange={(e) =>
                  setRegistrationFilter(e.target.value as 'unregistered' | 'incomplete' | 'all')
                }
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="unregistered">Not yet registered on platform</option>
                <option value="incomplete">Registered — profile incomplete</option>
                <option value="all">All MSMEs matching filters</option>
              </select>
            </div>
            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-md p-2">
              Estimated reach (demo): ~
              {district === 'All districts'
                ? '12,000'
                : sector.includes('Defence')
                  ? '240'
                  : '4,500'}{' '}
              contacts
            </p>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3 text-sm">
            <p className="text-slate-600">Review before launch:</p>
            <dl className="space-y-2">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Template</dt>
                <dd className="font-medium text-slate-900 text-right">{selectedTemplate.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Campaign</dt>
                <dd className="font-medium text-slate-900 text-right">
                  {campaignName.trim() || `${district} ${sector} drive`}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Audience</dt>
                <dd className="font-medium text-slate-900 text-right">{audienceLabel()}</dd>
              </div>
            </dl>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2 mt-2">
              Demo only — launching will add a row to the table above; no WhatsApp messages are sent.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
