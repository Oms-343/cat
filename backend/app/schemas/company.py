from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from app.models.company import BusinessActivity


class CompanyBase(BaseModel):
    # Section 1
    logo_url: str | None = None
    name: str = Field(min_length=1, max_length=200)
    legal_structure_code: str | None = None
    primary_place_of_business: str | None = None
    business_activity: BusinessActivity | None = None

    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    district_code: str | None = None
    taluk_code: str | None = None
    pincode: str | None = None
    state: str = "Tamil Nadu"

    sector_code: str | None = None

    contact_name: str | None = None
    contact_designation: str | None = None
    contact_email: EmailStr | None = None
    contact_phone: str | None = None
    website: str | None = None

    workforce_count: int | None = Field(default=None, ge=0)
    turnover_range_code: str | None = None
    exact_turnover_lakhs: float | None = Field(default=None, ge=0)
    is_mnc: bool = False

    # Section 2
    gst_number: str | None = None
    cin: str | None = None
    udyam_number: str | None = None
    pan: str | None = None


class CompanyCreate(CompanyBase):
    tags: list[str] = []


class CompanyUpdate(BaseModel):
    logo_url: str | None = None
    name: str | None = Field(default=None, min_length=1, max_length=200)
    legal_structure_code: str | None = None
    primary_place_of_business: str | None = None
    business_activity: BusinessActivity | None = None

    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    district_code: str | None = None
    taluk_code: str | None = None
    pincode: str | None = None
    state: str | None = None

    sector_code: str | None = None

    contact_name: str | None = None
    contact_designation: str | None = None
    contact_email: EmailStr | None = None
    contact_phone: str | None = None
    website: str | None = None

    workforce_count: int | None = Field(default=None, ge=0)
    turnover_range_code: str | None = None
    exact_turnover_lakhs: float | None = Field(default=None, ge=0)
    is_mnc: bool | None = None

    gst_number: str | None = None
    cin: str | None = None
    udyam_number: str | None = None
    pan: str | None = None

    tags: list[str] | None = None


class CompanyOut(CompanyBase):
    id: int
    tags: list[str]
    owner_user_id: int | None
    created_at: datetime
    updated_at: datetime

    # Computed
    profile_completion: int  # 0-100
    section_completion: dict[str, bool]  # per-section flags

    class Config:
        from_attributes = True


class CompanyListItem(BaseModel):
    """Lightweight shape for the registry table."""
    id: int
    name: str
    gst_number: str | None
    sector_code: str | None
    district_code: str | None
    turnover_range_code: str | None
    tags: list[str]
    profile_completion: int
    is_mnc: bool


class CompanyListResponse(BaseModel):
    items: list[CompanyListItem]
    total: int
    limit: int
    offset: int


class LockedFieldsResponse(BaseModel):
    locked_for_msme: list[str]
    tag_edit_roles: list[str]
