from sqlmodel import select

from app.models.company import Company
from app.models.company_subitem import (
    CompanyCertification,
    CompanyCustomer,
    CompanyMachinery,
    CompanyProduct,
)

SECTION_1_FIELDS = [
    "name", "address_line1", "city", "district_code", "pincode",
    "sector_code", "contact_name", "contact_email", "contact_phone",
    "workforce_count", "turnover_range_code", "business_activity",
]
SECTION_2_FIELDS = ["gst_number", "cin", "udyam_number", "pan"]


def _has_any(session, model, company_id: int | None) -> bool:
    if company_id is None:
        return False
    row = session.exec(
        select(model.id).where(model.company_id == company_id).limit(1)
    ).first()
    return row is not None


def section_completion(c: Company, session) -> dict[str, bool]:
    def filled(fields: list[str]) -> bool:
        return all(getattr(c, f) not in (None, "", 0) for f in fields)

    return {
        "basic_details": filled(SECTION_1_FIELDS),
        "registration": filled(SECTION_2_FIELDS),
        "products": _has_any(session, CompanyProduct, c.id),
        "certifications": _has_any(session, CompanyCertification, c.id),
        "customers": _has_any(session, CompanyCustomer, c.id),
        "machinery": _has_any(session, CompanyMachinery, c.id),
        "tags": bool(c.tags),
    }


def profile_completion_pct(c: Company, session) -> int:
    sc = section_completion(c, session)
    if not sc:
        return 0
    return round(sum(1 for v in sc.values() if v) * 100 / len(sc))
