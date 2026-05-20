"""Company table — covers Section 1 (Basic), Section 2 (Registration), Section 7 (Tags).

Sections 3-6 (Products, Certifications, Customers, Machinery) will become separate
related tables in later iterations.

Note on `locked` fields: a few attributes (name, legal structure, GST/CIN/Udyam, etc.)
notionally come from verified government records and should not be editable by MSME
users. We enforce this in the API layer via LOCKED_FIELDS_FOR_MSME below.
"""
from datetime import datetime, timezone
from enum import Enum
from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class BusinessActivity(str, Enum):
    MANUFACTURING = "manufacturing"
    SERVICE = "service"
    TRADE = "trade"


class Company(SQLModel, table=True):
    __tablename__ = "companies"

    id: int | None = Field(default=None, primary_key=True)

    # --- Section 1: Basic Details ---
    logo_url: str | None = None
    name: str = Field(index=True)
    legal_structure_code: str | None = Field(default=None, index=True)
    primary_place_of_business: str | None = None
    business_activity: BusinessActivity | None = None

    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    district_code: str | None = Field(default=None, index=True)
    taluk_code: str | None = Field(default=None, index=True)
    pincode: str | None = Field(default=None, index=True)
    state: str = Field(default="Tamil Nadu")

    sector_code: str | None = Field(default=None, index=True)

    contact_name: str | None = None
    contact_designation: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    website: str | None = None

    workforce_count: int | None = None
    turnover_range_code: str | None = Field(default=None, index=True)
    exact_turnover_lakhs: float | None = None
    is_mnc: bool = Field(default=False)

    # --- Section 2: Registration ---
    gst_number: str | None = Field(default=None, index=True)
    cin: str | None = Field(default=None, index=True)
    udyam_number: str | None = Field(default=None, index=True)
    pan: str | None = None

    # --- Section 7: Tags (TIDCO-only edits) ---
    tags: list[str] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))

    # --- Ownership / metadata ---
    owner_user_id: int | None = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Fields that MSME users cannot modify — they come from verified govt sources.
LOCKED_FIELDS_FOR_MSME: set[str] = {
    "name",
    "legal_structure_code",
    "primary_place_of_business",
    "gst_number",
    "cin",
    "udyam_number",
}

# Tag edits are restricted to TIDCO officials.
TAG_EDIT_ROLES: set[str] = {"super", "admin"}
