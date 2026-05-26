"""Onboarding drive (WhatsApp campaign) persistence."""
from datetime import datetime, timezone
from enum import Enum

from sqlmodel import Field, SQLModel


class RegistrationFilter(str, Enum):
    UNREGISTERED = "unregistered"
    INCOMPLETE = "incomplete"
    ALL = "all"


class CampaignStatus(str, Enum):
    DRAFT = "draft"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class MessageStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    FAILED = "failed"


class OnboardingCampaign(SQLModel, table=True):
    __tablename__ = "onboarding_campaigns"

    id: int | None = Field(default=None, primary_key=True)
    name: str
    template_id: str = Field(index=True)
    language_code: str = Field(default="en")
    district_code: str | None = Field(default=None, index=True)
    sector_code: str | None = Field(default=None, index=True)
    tag_filter: str | None = None
    registration_filter: RegistrationFilter = Field(default=RegistrationFilter.ALL)
    audience_label: str = ""

    status: CampaignStatus = Field(default=CampaignStatus.DRAFT)
    sent_count: int = 0
    delivered_count: int = 0
    responded_count: int = 0

    launched_at: datetime | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by_user_id: int | None = Field(default=None, foreign_key="users.id")


class OnboardingCampaignMessage(SQLModel, table=True):
    __tablename__ = "onboarding_campaign_messages"

    id: int | None = Field(default=None, primary_key=True)
    campaign_id: int = Field(foreign_key="onboarding_campaigns.id", index=True)
    company_id: int | None = Field(default=None, foreign_key="companies.id")
    outreach_contact_id: int | None = Field(default=None, foreign_key="outreach_contacts.id")
    phone: str = Field(index=True)
    recipient_name: str = Field(default="MSME")
    status: MessageStatus = Field(default=MessageStatus.PENDING)
    whatsapp_message_id: str | None = Field(default=None, index=True)
    error_message: str | None = None
    responded_at: datetime | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
