from datetime import datetime
from pydantic import BaseModel, Field

from app.models.onboarding_campaign import CampaignStatus, RegistrationFilter


class WhatsAppTemplateOut(BaseModel):
    id: str
    name: str
    purpose: str
    status: str = "approved"
    languages: list[str]
    preview_en: str
    preview_ta: str


class OutreachContactsOut(BaseModel):
    total_active: int


class OnboardingConfigOut(BaseModel):
    dry_run: bool
    whatsapp_configured: bool
    unregistered_audience_available: bool = False
    outreach_contacts_count: int = 0
    webhook_url: str
    webhook_verify_token_set: bool = True
    webhook_signature_verification: bool = False


class CampaignSimulateIn(BaseModel):
    step: str = Field(description="delivered | read | reply")


class CampaignSimulateOut(BaseModel):
    updated: int
    campaign: "CampaignOut"


class AudienceEstimateIn(BaseModel):
    district_code: str | None = None
    sector_code: str | None = None
    tag_filter: str | None = None
    registration_filter: RegistrationFilter = RegistrationFilter.ALL
    outreach_contact_ids: list[int] | None = None


class AudienceEstimateOut(BaseModel):
    count: int
    with_phone: int
    audience_label: str
    warning: str | None = None


class CampaignCreateIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    template_id: str
    language_code: str = Field(default="en", pattern="^(en|ta)$")
    district_code: str | None = None
    sector_code: str | None = None
    tag_filter: str | None = None
    registration_filter: RegistrationFilter = RegistrationFilter.ALL
    outreach_contact_ids: list[int] | None = None


class ContactsImportOut(BaseModel):
    created: int
    updated: int
    skipped: int
    contact_ids: list[int] = []


class CampaignOut(BaseModel):
    id: int
    name: str
    template_id: str
    template_name: str | None = None
    audience_label: str
    sent: int
    delivered_pct: int
    responded: int
    status: CampaignStatus
    launched_at: str | None
    dry_run: bool = True


class CampaignListOut(BaseModel):
    items: list[CampaignOut]
    summary: "CampaignSummaryOut"


class CampaignSummaryOut(BaseModel):
    campaign_count: int
    total_sent: int
    total_responded: int
    avg_delivery_pct: int


class CampaignLaunchOut(BaseModel):
    campaign: CampaignOut
    messages_queued: int
    dry_run: bool
    message: str
