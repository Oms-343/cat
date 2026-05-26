"""Prospect / unregistered MSME contacts for onboarding WhatsApp drives."""
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class OutreachContact(SQLModel, table=True):
    __tablename__ = "outreach_contacts"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    phone: str = Field(index=True)
    email: str | None = None
    district_code: str | None = Field(default=None, index=True)
    sector_code: str | None = Field(default=None, index=True)
    source: str = Field(default="import")
    is_active: bool = Field(default=True, index=True)
    converted_company_id: int | None = Field(default=None, foreign_key="companies.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
