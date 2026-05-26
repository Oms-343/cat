from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.company import BusinessActivity
from app.models.enrollment_invite import InviteKind, InviteStatus


class EnrollPrefillOut(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    legal_structure_code: str | None = None
    primary_place_of_business: str | None = None
    business_activity: str | None = None
    district_code: str | None = None
    sector_code: str | None = None
    taluk_code: str | None = None
    contact_name: str | None = None
    contact_phone: str | None = None
    contact_email: str | None = None
    contact_designation: str | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    pincode: str | None = None
    state: str | None = None
    website: str | None = None
    gst_number: str | None = None
    cin: str | None = None
    udyam_number: str | None = None
    pan: str | None = None
    workforce_count: int | None = None
    turnover_range_code: str | None = None
    exact_turnover_lakhs: float | None = None
    is_mnc: bool | None = None
    tags: list[str] | None = None


class EnrollInviteOut(BaseModel):
    token: str
    kind: InviteKind
    status: InviteStatus
    recipient_name: str
    company_id: int | None = None
    tab1_complete: bool = False
    can_submit_tab1: bool = False
    can_access_tab2: bool = False
    profile_completion: int | None = None
    section_completion: dict[str, bool] | None = None
    prefill: EnrollPrefillOut
    expires_at: datetime | None = None


class EnrollTab1Request(BaseModel):
    """Tab 1: basic details + registration (no portal login credentials)."""

    name: str = Field(min_length=1, max_length=200)
    contact_phone: str | None = None
    contact_name: str | None = None
    contact_designation: str | None = None
    contact_email: EmailStr | None = None
    legal_structure_code: str | None = None
    primary_place_of_business: str | None = None
    business_activity: BusinessActivity
    district_code: str = Field(min_length=1, max_length=20)
    sector_code: str = Field(min_length=1, max_length=20)
    taluk_code: str | None = None
    address_line1: str = Field(min_length=1, max_length=500)
    address_line2: str | None = None
    city: str = Field(min_length=1, max_length=100)
    pincode: str = Field(min_length=1, max_length=10)
    state: str = "Tamil Nadu"
    website: str | None = None
    workforce_count: int = Field(ge=0)
    turnover_range_code: str = Field(min_length=1, max_length=50)
    exact_turnover_lakhs: float | None = Field(default=None, ge=0)
    is_mnc: bool = False
    gst_number: str = Field(min_length=1, max_length=20)
    cin: str = Field(min_length=1, max_length=30)
    udyam_number: str = Field(min_length=1, max_length=30)
    pan: str = Field(min_length=1, max_length=15)


class EnrollTab1Response(BaseModel):
    company_id: int
    tab1_complete: bool
    profile_completion: int
    section_completion: dict[str, bool]
    message: str


class EnrollTagsUpdate(BaseModel):
    tags: list[str] = Field(default_factory=list)


class CampaignFunnelOut(BaseModel):
    sent: int
    opened: int
    onboarded: int
    partial: int
    complete: int
    total: int


class CampaignRemindIn(BaseModel):
    cohort: str = Field(description="not_onboarded | partial")
    message_ids: list[int] | None = None


class CampaignRemindOut(BaseModel):
    invites_created: int
    queued: int
