"""One-time enrollment links for WhatsApp onboarding campaigns."""
from datetime import datetime, timezone
from enum import Enum

from sqlmodel import Field, SQLModel


class InviteKind(str, Enum):
    INITIAL = "initial"
    REMINDER_NOT_ONBOARDED = "reminder_not_onboarded"
    REMINDER_PARTIAL = "reminder_partial"


class InviteStatus(str, Enum):
    ACTIVE = "active"
    USED = "used"
    EXPIRED = "expired"
    REVOKED = "revoked"


class EnrollmentInvite(SQLModel, table=True):
    __tablename__ = "enrollment_invites"

    id: int | None = Field(default=None, primary_key=True)
    token: str = Field(index=True, unique=True)
    campaign_message_id: int | None = Field(
        default=None, foreign_key="onboarding_campaign_messages.id", index=True
    )
    outreach_contact_id: int | None = Field(default=None, foreign_key="outreach_contacts.id")
    company_id: int | None = Field(default=None, foreign_key="companies.id")
    phone: str = Field(index=True)
    recipient_name: str = Field(default="MSME")
    email: str | None = None
    kind: InviteKind = Field(default=InviteKind.INITIAL)
    status: InviteStatus = Field(default=InviteStatus.ACTIVE, index=True)
    opened_at: datetime | None = None
    tab1_submitted_at: datetime | None = None
    used_at: datetime | None = None
    expires_at: datetime | None = None
    created_company_id: int | None = Field(default=None, foreign_key="companies.id")
    created_user_id: int | None = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
