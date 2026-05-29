"""Resolve MSME audience for onboarding WhatsApp campaigns."""
from dataclasses import dataclass

from sqlmodel import Session, select

from app.core.company_completion import profile_completion_pct
from app.core.outreach_contacts import IMPORT_COLUMNS_HINT, outreach_district_filter
from app.core.phone import normalize_phone
from app.models.company import Company
from app.models.master import DistrictMaster, SectorMaster
from app.models.onboarding_campaign import RegistrationFilter
from app.models.outreach_contact import OutreachContact


@dataclass
class AudienceRecipient:
    company_id: int | None
    outreach_contact_id: int | None
    phone: str
    name: str


@dataclass
class AudienceResult:
    recipients: list[AudienceRecipient]
    audience_label: str
    warning: str | None


def _district_name(session: Session, code: str | None) -> str:
    if not code:
        return "All districts"
    row = session.exec(select(DistrictMaster).where(DistrictMaster.code == code)).first()
    return row.name if row else code


def _sector_name(session: Session, code: str | None) -> str:
    if not code:
        return "All sectors"
    row = session.exec(select(SectorMaster).where(SectorMaster.code == code)).first()
    return row.name if row else code


def _registration_label(reg: RegistrationFilter) -> str:
    if reg == RegistrationFilter.UNREGISTERED:
        return "Unregistered"
    if reg == RegistrationFilter.INCOMPLETE:
        return "Incomplete profile"
    return "All MSMEs"


def build_audience_label(
    session: Session,
    *,
    district_code: str | None,
    sector_code: str | None,
    registration_filter: RegistrationFilter,
) -> str:
    parts = [
        _district_name(session, district_code),
        _sector_name(session, sector_code),
        _registration_label(registration_filter),
    ]
    return " · ".join(parts)


def _resolve_outreach_contacts(
    session: Session,
    *,
    district_code: str | None,
    sector_code: str | None,
    outreach_contact_ids: list[int] | None = None,
) -> list[AudienceRecipient]:
    stmt = select(OutreachContact).where(OutreachContact.is_active == True)  # noqa: E712
    if outreach_contact_ids:
        stmt = stmt.where(OutreachContact.id.in_(outreach_contact_ids))
    else:
        district_clause = outreach_district_filter(session, district_code)
        if district_clause is not None:
            stmt = stmt.where(district_clause)

    rows = session.exec(stmt.order_by(OutreachContact.company_name)).all()
    seen_phones: set[str] = set()
    recipients: list[AudienceRecipient] = []
    for row in rows:
        phone = normalize_phone(row.phone)
        if not phone or phone in seen_phones:
            continue
        seen_phones.add(phone)
        recipients.append(
            AudienceRecipient(
                company_id=None,
                outreach_contact_id=row.id,
                phone=phone,
                name=row.company_name,
            )
        )
    return recipients


def resolve_audience(
    session: Session,
    *,
    district_code: str | None,
    sector_code: str | None,
    registration_filter: RegistrationFilter,
    outreach_contact_ids: list[int] | None = None,
) -> AudienceResult:
    if registration_filter == RegistrationFilter.UNREGISTERED and outreach_contact_ids:
        label = f"Excel import · {len(outreach_contact_ids)} row(s)"
    else:
        label = build_audience_label(
            session,
            district_code=district_code,
            sector_code=sector_code,
            registration_filter=registration_filter,
        )

    if registration_filter == RegistrationFilter.UNREGISTERED:
        recipients = _resolve_outreach_contacts(
            session,
            district_code=district_code,
            sector_code=sector_code,
            outreach_contact_ids=outreach_contact_ids,
        )
        if not recipients:
            msg = (
                "No valid contacts in the uploaded file. "
                f"Each row needs company_name and phone (columns: {IMPORT_COLUMNS_HINT})."
            )
            if not outreach_contact_ids:
                msg = (
                    "No outreach contacts match these filters. "
                    f"Upload an Excel or CSV file with columns: {IMPORT_COLUMNS_HINT}."
                )
            return AudienceResult(recipients=[], audience_label=label, warning=msg)
        if outreach_contact_ids:
            label = f"Excel import · {len(recipients)} contact(s)"
        return AudienceResult(recipients=recipients, audience_label=label, warning=None)

    stmt = select(Company)
    if district_code:
        stmt = stmt.where(Company.district_code == district_code)
    if sector_code:
        stmt = stmt.where(Company.sector_code == sector_code)

    companies = session.exec(stmt.order_by(Company.name)).all()
    recipients: list[AudienceRecipient] = []
    seen_phones: set[str] = set()

    for c in companies:
        if registration_filter == RegistrationFilter.INCOMPLETE:
            if profile_completion_pct(c, session) >= 100:
                continue

        phone = normalize_phone(c.contact_phone)
        if not phone or phone in seen_phones:
            continue
        seen_phones.add(phone)

        recipients.append(
            AudienceRecipient(
                company_id=c.id,
                outreach_contact_id=None,
                phone=phone,
                name=c.name,
            )
        )

    return AudienceResult(recipients=recipients, audience_label=label, warning=None)
