import { useCallback, useEffect, useState } from "react";
import { Modal } from "../components/Modal";
import { ApiError } from "../api/client";
import { listEntries } from "../api/masters";
import {
  estimateAudience,
  getOnboardingConfig,
  importOutreachContacts,
  launchCampaign,
  listCampaigns,
  listWhatsAppTemplates,
  simulateCampaignWebhook,
  getCampaignFunnel,
  remindCampaign,
  type Campaign,
  type CampaignFunnel,
  type OnboardingConfig,
  type AudienceSource,
  type RegistrationFilter,
  type WhatsAppTemplate,
} from "../api/onboardingDrives";
import type { MasterEntry } from "../types/master";
import { SUGGESTED_COMPANY_TAGS } from "../constants/companyTags";

function responseRate(c: Campaign): number {
  if (c.sent === 0) return 0;
  return Math.round((c.responded / c.sent) * 100);
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-IN");
}

export function OnboardingDrivesPage() {
  const [config, setConfig] = useState<OnboardingConfig | null>(null);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [summary, setSummary] = useState({
    campaign_count: 0,
    total_sent: 0,
    total_responded: 0,
    avg_delivery_pct: 0,
  });
  const [districts, setDistricts] = useState<MasterEntry[]>([]);
  const [sectors, setSectors] = useState<MasterEntry[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [sectorCode, setSectorCode] = useState("");
  const [registrationFilter, setRegistrationFilter] =
    useState<RegistrationFilter>("incomplete");
  const [languageCode, setLanguageCode] = useState<"en" | "ta">("en");
  const [tagFilter, setTagFilter] = useState("");
  const [audienceSource, setAudienceSource] =
    useState<AudienceSource>("platform");
  const [importedContactIds, setImportedContactIds] = useState<number[]>([]);
  const [importWizardMessage, setImportWizardMessage] = useState<string | null>(
    null,
  );
  const [importing, setImporting] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchMessage, setLaunchMessage] = useState<string | null>(null);

  const [estimateCount, setEstimateCount] = useState<number | null>(null);
  const [estimateWarning, setEstimateWarning] = useState<string | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [simulatingId, setSimulatingId] = useState<number | null>(null);
  const [funnelById, setFunnelById] = useState<Record<number, CampaignFunnel>>(
    {},
  );
  const [funnelLoadingId, setFunnelLoadingId] = useState<number | null>(null);
  const [remindingId, setRemindingId] = useState<number | null>(null);

  const refreshCampaigns = useCallback(async () => {
    const campRes = await listCampaigns();
    setCampaigns(campRes.items);
    setSummary(campRes.summary);
  }, []);

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cfg, tpls, campRes, distRows, sectorRows] = await Promise.all([
        getOnboardingConfig(),
        listWhatsAppTemplates(),
        listCampaigns(),
        listEntries("districts", { active: true }),
        listEntries("sectors", { active: true }),
      ]);
      setConfig(cfg);
      setTemplates(tpls);
      setCampaigns(campRes.items);
      setSummary(campRes.summary);
      setDistricts(distRows);
      setSectors(sectorRows);
      if (tpls.length) {
        setSelectedTemplateId((prev) => prev || tpls[0].id);
      }
    } catch (err) {
      if (err instanceof ApiError) setError(`${err.status}: ${err.detail}`);
      else setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const hasRunningCampaigns = campaigns.some((c) => c.status === "running");

  useEffect(() => {
    if (!hasRunningCampaigns) return;
    const timer = window.setInterval(() => {
      refreshCampaigns().catch(() => {});
    }, 4000);
    return () => window.clearInterval(timer);
  }, [hasRunningCampaigns, refreshCampaigns]);

  const selectedTemplate =
    templates.find((t) => t.id === selectedTemplateId) ?? templates[0];

  const refreshEstimate = useCallback(async () => {
    if (!wizardOpen || (step !== 3 && step !== 4)) return;
    if (audienceSource === "excel" && importedContactIds.length === 0) {
      setEstimateCount(0);
      setEstimateWarning("Upload an Excel or CSV file to see estimated reach.");
      setEstimateLoading(false);
      return;
    }
    setEstimateLoading(true);
    setEstimateWarning(null);
    try {
      const est = await estimateAudience({
        district_code:
          audienceSource === "platform" ? districtCode || null : null,
        sector_code: audienceSource === "platform" ? sectorCode || null : null,
        tag_filter:
          audienceSource === "platform" ? tagFilter.trim() || null : null,
        registration_filter:
          audienceSource === "excel" ? "unregistered" : registrationFilter,
        outreach_contact_ids:
          audienceSource === "excel" ? importedContactIds : null,
      });
      setEstimateCount(est.count);
      setEstimateWarning(est.warning);
    } catch (err) {
      setEstimateCount(null);
      if (err instanceof ApiError) setEstimateWarning(String(err.detail));
    } finally {
      setEstimateLoading(false);
    }
  }, [
    wizardOpen,
    step,
    audienceSource,
    importedContactIds,
    districtCode,
    sectorCode,
    tagFilter,
    registrationFilter,
  ]);

  useEffect(() => {
    refreshEstimate();
  }, [refreshEstimate]);

  function openWizard() {
    setStep(1);
    if (templates[0]) setSelectedTemplateId(templates[0].id);
    setCampaignName("");
    setDistrictCode("");
    setSectorCode("");
    setRegistrationFilter("incomplete");
    setLanguageCode("en");
    setTagFilter("");
    setAudienceSource("platform");
    setImportedContactIds([]);
    setImportWizardMessage(null);
    setEstimateCount(null);
    setEstimateWarning(null);
    setWizardOpen(true);
  }

  function closeWizard() {
    setWizardOpen(false);
    setLaunching(false);
  }

  function audienceLabelPreview(): string {
    if (audienceSource === "excel") {
      const n = importedContactIds.length;
      return n ? `Excel import · ${n} contact(s)` : "Excel import";
    }
    const district = districtCode
      ? (districts.find((d) => d.code === districtCode)?.name ?? districtCode)
      : "All districts";
    const sector = sectorCode
      ? (sectors.find((s) => s.code === sectorCode)?.name ?? sectorCode)
      : "All sectors";
    const reg =
      registrationFilter === "unregistered"
        ? "Unregistered"
        : registrationFilter === "incomplete"
          ? "Incomplete profile"
          : "All MSMEs";
    return `${district} · ${sector} · ${reg}`;
  }

  async function handleSimulate(
    campaignId: number,
    step: "delivered" | "read" | "reply",
  ) {
    setSimulatingId(campaignId);
    setError(null);
    try {
      const res = await simulateCampaignWebhook(campaignId, step);
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaignId ? res.campaign : c)),
      );
      await refreshCampaigns();
    } catch (err) {
      if (err instanceof ApiError) setError(`${err.status}: ${err.detail}`);
      else setError(String(err));
    } finally {
      setSimulatingId(null);
    }
  }

  async function handleLoadFunnel(campaignId: number) {
    setFunnelLoadingId(campaignId);
    setError(null);
    try {
      const funnel = await getCampaignFunnel(campaignId);
      setFunnelById((prev) => ({ ...prev, [campaignId]: funnel }));
    } catch (err) {
      if (err instanceof ApiError) setError(`${err.status}: ${err.detail}`);
      else setError(String(err));
    } finally {
      setFunnelLoadingId(null);
    }
  }

  async function handleRemind(
    campaignId: number,
    cohort: "not_onboarded" | "partial",
  ) {
    setRemindingId(campaignId);
    setError(null);
    try {
      const res = await remindCampaign(campaignId, cohort);
      setLaunchMessage(
        `Reminder queued: ${res.invites_created} new enrollment link(s).`,
      );
      await refreshCampaigns();
      await handleLoadFunnel(campaignId);
    } catch (err) {
      if (err instanceof ApiError) setError(`${err.status}: ${err.detail}`);
      else setError(String(err));
    } finally {
      setRemindingId(null);
    }
  }

  async function handleWizardImport(file: File) {
    setImporting(true);
    setImportWizardMessage(null);
    setEstimateWarning(null);
    try {
      const res = await importOutreachContacts(file);
      const ids = res.contact_ids ?? [];
      setImportedContactIds(ids);
      setImportWizardMessage(
        `Uploaded ${ids.length} contact${ids.length === 1 ? "" : "s"}.`,
      );
      const cfg = await getOnboardingConfig();
      setConfig(cfg);
    } catch (err) {
      setImportedContactIds([]);
      setImportWizardMessage(null);
      setEstimateWarning(err instanceof Error ? err.message : String(err));
    } finally {
      setImporting(false);
    }
  }

  async function handleLaunch() {
    const name =
      campaignName.trim() ||
      `${districts.find((d) => d.code === districtCode)?.name ?? "Statewide"} drive`;
    setLaunching(true);
    setError(null);
    try {
      const res = await launchCampaign({
        name,
        template_id: selectedTemplateId,
        language_code: languageCode,
        district_code:
          audienceSource === "platform" ? districtCode || null : null,
        sector_code: audienceSource === "platform" ? sectorCode || null : null,
        tag_filter:
          audienceSource === "platform" ? tagFilter.trim() || null : null,
        registration_filter:
          audienceSource === "excel" ? "unregistered" : registrationFilter,
        outreach_contact_ids:
          audienceSource === "excel" ? importedContactIds : null,
      });
      setLaunchMessage(res.message);
      setCampaigns((prev) => [res.campaign, ...prev]);
      setSummary((s) => ({
        campaign_count: s.campaign_count + 1,
        total_sent: s.total_sent + res.campaign.sent,
        total_responded: s.total_responded + res.campaign.responded,
        avg_delivery_pct: s.avg_delivery_pct,
      }));
      await loadPage();
      closeWizard();
    } catch (err) {
      if (err instanceof ApiError) setError(`${err.status}: ${err.detail}`);
      else setError(String(err));
    } finally {
      setLaunching(false);
    }
  }

  if (loading && !templates.length) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-8 text-sm text-slate-500">
        Loading onboarding drives…
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Onboarding Drives
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            WhatsApp campaigns to invite and remind MSMEs to register or
            complete their profiles. Pre-approved bilingual templates, audience
            targeting, and delivery tracking.
          </p>
        </div>
        <button
          type="button"
          onClick={openWizard}
          disabled={!templates.length}
          className="text-sm font-medium bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          + New campaign
        </button>
      </header>

      {config?.dry_run && (
        <div className="mb-6 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-4 py-3">
          <strong>Dry-run mode.</strong> Messages are not sent to WhatsApp.
          After launch, use <strong>Simulate delivery</strong> on running
          campaigns to mimic webhook stats. For production, set{" "}
          <code className="text-xs">WHATSAPP_ACCESS_TOKEN</code>,{" "}
          <code className="text-xs">WHATSAPP_PHONE_NUMBER_ID</code>, and{" "}
          <code className="text-xs">WHATSAPP_DRY_RUN=false</code>.
        </div>
      )}

      {config && !config.dry_run && config.whatsapp_configured && (
        <div className="mb-6 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-4 py-3">
          <strong>Live mode.</strong> Delivery and reply counts update
          automatically from the WhatsApp webhook.
        </div>
      )}

      {config && (
        <div className="mb-6 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-4 py-3 space-y-2">
          <p>
            <strong>Webhook URL</strong> (register in Meta Developer Console →
            WhatsApp → Configuration):
          </p>
          <code className="block text-xs bg-white border border-slate-200 rounded px-2 py-1.5 break-all">
            {config.webhook_url}
          </code>
          <p className="text-xs text-slate-500">
            Verify token: <code>WHATSAPP_WEBHOOK_VERIFY_TOKEN</code>
            {config.webhook_signature_verification
              ? " · Signature verification enabled (WHATSAPP_APP_SECRET set)"
              : " · Set WHATSAPP_APP_SECRET to verify X-Hub-Signature-256"}
          </p>
          {config.enroll_public_url ? (
            <p className="text-xs text-slate-600">
              <strong>Enrollment app URL</strong> (links in WhatsApp messages):{" "}
              <code className="bg-white border border-slate-200 rounded px-1">
                {config.enroll_public_url}
              </code>
            </p>
          ) : null}
          {hasRunningCampaigns && (
            <p className="text-xs text-blue-700">
              Refreshing campaign stats every 4 seconds…
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="mb-6 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md px-4 py-3">
          {error}
        </div>
      )}

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
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Campaigns
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {summary.campaign_count}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Messages sent
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {formatNumber(summary.total_sent)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Avg delivery · responses
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {summary.avg_delivery_pct}% ·{" "}
            {formatNumber(summary.total_responded)}
          </p>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">
          Campaign performance
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {campaigns.length === 0 ? (
            <p className="px-4 py-8 text-sm text-slate-500 text-center">
              No campaigns yet. Launch your first onboarding drive.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-4 py-3">Audience</th>
                  <th className="px-4 py-3 text-right">Sent</th>
                  <th className="px-4 py-3 text-right">Delivered</th>
                  <th className="px-4 py-3 text-right">Responded</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const rate = responseRate(c);
                  const busy = simulatingId === c.id;
                  const funnel = funnelById[c.id];
                  const funnelBusy = funnelLoadingId === c.id;
                  const remindBusy = remindingId === c.id;
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {c.template_name ?? c.template_id}
                          {c.launched_at ? ` · ${c.launched_at}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs">
                        {c.audience_label}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatNumber(c.sent)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {c.delivered_pct}%
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="tabular-nums">
                          {formatNumber(c.responded)}
                        </span>
                        <span
                          className={`ml-1 text-xs font-semibold ${
                            rate >= 50
                              ? "text-emerald-700"
                              : rate >= 25
                                ? "text-slate-600"
                                : "text-amber-700"
                          }`}
                        >
                          ({rate}%)
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase ${
                            c.status === "running"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : c.status === "completed"
                                ? "bg-slate-100 text-slate-700 border-slate-200"
                                : c.status === "failed"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {c.status === "running" && c.sent === 0 ? (
                          <span className="text-xs text-blue-600">
                            Sending…
                          </span>
                        ) : c.status === "running" && config?.dry_run ? (
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              disabled={busy || c.sent === 0}
                              onClick={() => handleSimulate(c.id, "delivered")}
                              className="text-xs text-blue-700 hover:underline disabled:opacity-50 text-left"
                            >
                              Simulate delivery
                            </button>
                            <button
                              type="button"
                              disabled={busy || c.sent === 0}
                              onClick={() => handleSimulate(c.id, "reply")}
                              className="text-xs text-slate-600 hover:underline disabled:opacity-50 text-left"
                            >
                              Simulate replies
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              disabled={funnelBusy || c.sent === 0}
                              onClick={() => handleLoadFunnel(c.id)}
                              className="text-xs text-teal-700 hover:underline disabled:opacity-50 text-left"
                            >
                              {funnelBusy
                                ? "Loading funnel…"
                                : "Enrollment funnel"}
                            </button>
                            {funnel ? (
                              <>
                                <p className="text-[10px] text-slate-500 leading-snug">
                                  Sent {funnel.sent} → Opened {funnel.opened} →
                                  Onboarded {funnel.onboarded} → Partial{" "}
                                  {funnel.partial} → Complete {funnel.complete}
                                </p>
                                <button
                                  type="button"
                                  disabled={remindBusy}
                                  onClick={() =>
                                    handleRemind(c.id, "not_onboarded")
                                  }
                                  className="text-xs text-amber-700 hover:underline disabled:opacity-50 text-left"
                                >
                                  Remind not onboarded
                                </button>
                                <button
                                  type="button"
                                  disabled={remindBusy}
                                  onClick={() => handleRemind(c.id, "partial")}
                                  className="text-xs text-slate-600 hover:underline disabled:opacity-50 text-left"
                                >
                                  Remind partial profiles
                                </button>
                              </>
                            ) : null}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">
          Pre-approved message templates
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          WhatsApp requires Meta-approved templates. Only templates listed here
          can be used in campaigns.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-slate-900 text-sm">
                  {t.name}
                </h3>
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
                    {lang === "en" ? "English" : "Tamil"}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
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
              {step === 1 ? "Cancel" : "Back"}
            </button>
            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={
                  step === 3 &&
                  audienceSource === "excel" &&
                  importedContactIds.length === 0
                }
                className="text-sm font-medium bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-60"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLaunch}
                disabled={
                  launching || estimateCount === 0 || estimateCount === null
                }
                className="text-sm font-medium bg-green-600 text-white px-4 py-1.5 rounded-md hover:bg-green-700 disabled:opacity-60"
              >
                {launching ? "Launching…" : "Launch campaign"}
              </button>
            )}
          </div>
        }
      >
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Choose an approved template for this drive.
            </p>
            {templates.map((t) => (
              <label
                key={t.id}
                className={`flex gap-3 p-3 rounded-lg border cursor-pointer ${
                  selectedTemplateId === t.id
                    ? "border-green-500 bg-green-50/50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="template"
                  checked={selectedTemplateId === t.id}
                  onChange={() => {
                    setSelectedTemplateId(t.id);
                    if (!t.languages.includes(languageCode)) {
                      setLanguageCode(t.languages[0] === "ta" ? "ta" : "en");
                    }
                  }}
                  className="mt-1"
                />
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 text-sm">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.id}</p>
                  <p className="text-xs text-slate-600 mt-1">{t.purpose}</p>
                </div>
              </label>
            ))}
            <div className="pt-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Message language
              </label>
              <select
                value={languageCode}
                onChange={(e) => setLanguageCode(e.target.value as "en" | "ta")}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              >
                {(selectedTemplate?.languages ?? ["en"]).includes("en") && (
                  <option value="en">English</option>
                )}
                {(selectedTemplate?.languages ?? []).includes("ta") && (
                  <option value="ta">Tamil</option>
                )}
              </select>
            </div>
          </div>
        )}

        {step === 2 && selectedTemplate && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Preview how recipients will see the message (variables shown as
              placeholders).
            </p>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                English
              </p>
              <div className="text-sm bg-[#e7fce3] border border-green-200 rounded-lg p-3 text-slate-800">
                {selectedTemplate.preview_en}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                தமிழ்
              </p>
              <div className="text-sm bg-[#e7fce3] border border-green-200 rounded-lg p-3 text-slate-800">
                {selectedTemplate.preview_ta}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Campaign name
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. Erode textile onboarding"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <fieldset>
              <legend className="block text-xs font-medium text-slate-700 mb-2">
                Who should receive this campaign?
              </legend>
              <div className="space-y-2">
                <label className="flex gap-2 items-start text-sm text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="audienceSource"
                    checked={audienceSource === "platform"}
                    onChange={() => {
                      setAudienceSource("platform");
                      setImportedContactIds([]);
                      setImportWizardMessage(null);
                    }}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="font-medium">MSMEs on the platform</span>
                    <span className="block text-xs text-slate-500">
                      Filter by district, sector, and registration status.
                    </span>
                  </span>
                </label>
                <label className="flex gap-2 items-start text-sm text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="audienceSource"
                    checked={audienceSource === "excel"}
                    onChange={() => {
                      setAudienceSource("excel");
                      setRegistrationFilter("unregistered");
                    }}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="font-medium">Excel / CSV file</span>
                    <span className="block text-xs text-slate-500">
                      Send only to contacts in your upload (unregistered
                      prospects).
                    </span>
                  </span>
                </label>
              </div>
            </fieldset>

            {audienceSource === "platform" ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    District
                  </label>
                  <select
                    value={districtCode}
                    onChange={(e) => setDistrictCode(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">All districts</option>
                    {districts.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Sector
                  </label>
                  <select
                    value={sectorCode}
                    onChange={(e) => setSectorCode(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">All sectors</option>
                    {sectors.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Audience
                  </label>
                  <select
                    value={registrationFilter}
                    onChange={(e) =>
                      setRegistrationFilter(
                        e.target.value as RegistrationFilter,
                      )
                    }
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="incomplete">
                      Registered — profile incomplete
                    </option>
                    <option value="all">All MSMEs matching filters</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tag filter (optional)
                  </label>
                  <select
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">No tag filter</option>
                    {SUGGESTED_COMPANY_TAGS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                <p className="text-sm text-slate-600">
                  Upload a <strong>.xlsx</strong> or <strong>.csv</strong> with
                  columns:{" "}
                  <code className="text-xs">
                    name, phone, district_code, sector_code
                  </code>
                  . The campaign will message{" "}
                  <strong>only the rows in this file</strong>.
                </p>
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  disabled={importing}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleWizardImport(f);
                    e.target.value = "";
                  }}
                  className="text-sm w-full"
                />
                {importing && (
                  <p className="text-sm text-slate-500">Reading file…</p>
                )}
                {importWizardMessage && (
                  <p className="text-sm text-emerald-700">
                    {importWizardMessage}
                  </p>
                )}
              </div>
            )}

            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-md p-2">
              {estimateLoading
                ? "Calculating estimated reach…"
                : estimateCount !== null
                  ? `Estimated reach: ${formatNumber(estimateCount)} contacts with phone numbers`
                  : "Estimated reach: —"}
            </p>
            {estimateWarning && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
                {estimateWarning}
              </p>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3 text-sm">
            <p className="text-slate-600">Review before launch:</p>
            <dl className="space-y-2">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Template</dt>
                <dd className="font-medium text-slate-900 text-right">
                  {selectedTemplate?.name ?? selectedTemplateId}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Campaign</dt>
                <dd className="font-medium text-slate-900 text-right">
                  {campaignName.trim() || audienceLabelPreview()}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Audience</dt>
                <dd className="font-medium text-slate-900 text-right">
                  {audienceLabelPreview()}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Recipients</dt>
                <dd className="font-medium text-slate-900 text-right">
                  {estimateCount !== null ? formatNumber(estimateCount) : "—"}
                </dd>
              </div>
            </dl>
            {config?.dry_run && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2 mt-2">
                Dry-run: messages will be recorded but not sent to WhatsApp
                until API credentials are configured.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
