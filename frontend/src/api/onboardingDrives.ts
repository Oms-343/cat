import { api } from "./client";

export type RegistrationFilter = "unregistered" | "incomplete" | "all";

export interface WhatsAppTemplate {
  id: string;
  name: string;
  purpose: string;
  status: string;
  languages: string[];
  preview_en: string;
  preview_ta: string;
}

export interface OnboardingConfig {
  dry_run: boolean;
  whatsapp_configured: boolean;
  unregistered_audience_available: boolean;
  outreach_contacts_count: number;
  webhook_url: string;
  webhook_verify_token_set: boolean;
  webhook_signature_verification: boolean;
}

export interface ContactsImportResult {
  created: number;
  updated: number;
  skipped: number;
  contact_ids: number[];
}

export interface Campaign {
  id: number;
  name: string;
  template_id: string;
  template_name: string | null;
  audience_label: string;
  sent: number;
  delivered_pct: number;
  responded: number;
  status: "draft" | "running" | "completed" | "failed";
  launched_at: string | null;
  dry_run: boolean;
}

export interface CampaignListResponse {
  items: Campaign[];
  summary: {
    campaign_count: number;
    total_sent: number;
    total_responded: number;
    avg_delivery_pct: number;
  };
}

export interface AudienceEstimate {
  count: number;
  with_phone: number;
  audience_label: string;
  warning: string | null;
}

export interface CampaignLaunchResponse {
  campaign: Campaign;
  messages_queued: number;
  dry_run: boolean;
  message: string;
}

export interface CreateCampaignPayload {
  name: string;
  template_id: string;
  language_code: "en" | "ta";
  district_code?: string | null;
  sector_code?: string | null;
  tag_filter?: string | null;
  registration_filter: RegistrationFilter;
  outreach_contact_ids?: number[] | null;
}

export interface EstimateAudiencePayload {
  district_code?: string | null;
  sector_code?: string | null;
  tag_filter?: string | null;
  registration_filter: RegistrationFilter;
  outreach_contact_ids?: number[] | null;
}

export type AudienceSource = "platform" | "excel";

export function getOnboardingConfig(): Promise<OnboardingConfig> {
  return api<OnboardingConfig>("/api/onboarding-drives/config");
}

export function listWhatsAppTemplates(): Promise<WhatsAppTemplate[]> {
  return api<WhatsAppTemplate[]>("/api/onboarding-drives/templates");
}

export function listCampaigns(): Promise<CampaignListResponse> {
  return api<CampaignListResponse>("/api/onboarding-drives/campaigns");
}

export function estimateAudience(
  payload: EstimateAudiencePayload,
): Promise<AudienceEstimate> {
  return api<AudienceEstimate>("/api/onboarding-drives/campaigns/estimate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function importOutreachContacts(
  file: File,
): Promise<ContactsImportResult> {
  const form = new FormData();
  form.append("file", file);
  const token = localStorage.getItem("msme.token");
  return fetch("/api/onboarding-drives/contacts/import", {
    method: "POST",
    body: form,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).then(async (res) => {
    if (!res.ok) {
      let detail = res.statusText;
      try {
        const body = await res.json();
        detail = body?.detail ?? detail;
      } catch {
        // ignore
      }
      throw new Error(detail);
    }
    return res.json() as Promise<ContactsImportResult>;
  });
}

export function launchCampaign(
  payload: CreateCampaignPayload,
): Promise<CampaignLaunchResponse> {
  return api<CampaignLaunchResponse>("/api/onboarding-drives/campaigns", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function simulateCampaignWebhook(
  campaignId: number,
  step: "delivered" | "read" | "reply",
): Promise<{ updated: number; campaign: Campaign }> {
  return api<{ updated: number; campaign: Campaign }>(
    `/api/onboarding-drives/campaigns/${campaignId}/simulate`,
    {
      method: "POST",
      body: JSON.stringify({ step }),
    },
  );
}
