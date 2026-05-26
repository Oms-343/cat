"""Enrollment invite creation, validation, and funnel metrics."""
from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

from sqlmodel import Session, select

from app.config import Settings, get_settings
from app.core.company_completion import profile_completion_pct, tab1_complete
from app.core.phone import normalize_phone, phone_digits_key
from app.models.company import Company
from app.models.enrollment_invite import EnrollmentInvite, InviteKind, InviteStatus
from app.models.onboarding_campaign import (
    MessageStatus,
    OnboardingCampaignMessage,
)
from app.models.outreach_contact import OutreachContact


def _as_utc_aware(dt: datetime) -> datetime:
    """SQLite often returns naive datetimes; treat them as UTC for comparisons."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def generate_invite_token() -> str:
    return secrets.token_urlsafe(32)


def enroll_link(settings: Settings, token: str) -> str:
    base = settings.enroll_public_url.rstrip("/")
    return f"{base}/enroll/{token}"


def create_invite_for_message(
    session: Session,
    *,
    message: OnboardingCampaignMessage,
    kind: InviteKind = InviteKind.INITIAL,
    company_id: int | None = None,
    outreach_contact_id: int | None = None,
    email: str | None = None,
    ttl_days: int | None = None,
) -> EnrollmentInvite:
    settings = get_settings()
    ttl = ttl_days if ttl_days is not None else settings.enrollment_invite_ttl_days
    now = utc_now()
    expires_at = now + timedelta(days=ttl) if ttl > 0 else None

    invite = EnrollmentInvite(
        token=generate_invite_token(),
        campaign_message_id=message.id,
        outreach_contact_id=outreach_contact_id or message.outreach_contact_id,
        company_id=company_id or message.company_id,
        phone=message.phone,
        recipient_name=message.recipient_name,
        email=email,
        kind=kind,
        status=InviteStatus.ACTIVE,
        expires_at=expires_at,
    )
    session.add(invite)
    session.flush()
    message.enrollment_invite_id = invite.id
    session.add(message)
    return invite


def get_invite_by_token(session: Session, token: str) -> EnrollmentInvite | None:
    return session.exec(
        select(EnrollmentInvite).where(EnrollmentInvite.token == token)
    ).first()


def invite_is_usable(invite: EnrollmentInvite) -> tuple[bool, str | None]:
    if invite.status == InviteStatus.REVOKED:
        return False, "This enrollment link is no longer valid"
    if invite.status == InviteStatus.EXPIRED:
        return False, "This enrollment link has expired"
    if invite.expires_at and _as_utc_aware(invite.expires_at) < utc_now():
        return False, "This enrollment link has expired"
    return True, None


def mark_invite_opened(session: Session, invite: EnrollmentInvite) -> None:
    if invite.opened_at is None:
        invite.opened_at = utc_now()
        session.add(invite)


def _company_prefill(company: Company, invite: EnrollmentInvite) -> dict:
    return {
        "name": company.name,
        "phone": company.contact_phone or invite.phone,
        "email": company.contact_email or invite.email,
        "legal_structure_code": company.legal_structure_code,
        "primary_place_of_business": company.primary_place_of_business,
        "business_activity": (
            company.business_activity.value if company.business_activity else None
        ),
        "district_code": company.district_code,
        "sector_code": company.sector_code,
        "taluk_code": company.taluk_code,
        "contact_name": company.contact_name or invite.recipient_name,
        "contact_phone": company.contact_phone or invite.phone,
        "contact_email": company.contact_email or invite.email,
        "contact_designation": company.contact_designation,
        "address_line1": company.address_line1,
        "address_line2": company.address_line2,
        "city": company.city,
        "pincode": company.pincode,
        "state": company.state,
        "website": company.website,
        "gst_number": company.gst_number,
        "cin": company.cin,
        "udyam_number": company.udyam_number,
        "pan": company.pan,
        "workforce_count": company.workforce_count,
        "turnover_range_code": company.turnover_range_code,
        "exact_turnover_lakhs": company.exact_turnover_lakhs,
        "is_mnc": company.is_mnc,
        "tags": list(company.tags or []),
    }


def build_prefill(session: Session, invite: EnrollmentInvite) -> dict:
    """Prefill data for the enroll form."""
    data: dict = {
        "name": invite.recipient_name,
        "phone": invite.phone,
        "email": invite.email,
        "district_code": None,
        "sector_code": None,
        "contact_name": invite.recipient_name,
        "contact_phone": invite.phone,
        "contact_email": invite.email,
    }

    company_id = invite.created_company_id or invite.company_id
    if company_id:
        company = session.get(Company, company_id)
        if company:
            data.update(_company_prefill(company, invite))
            return data

    if invite.outreach_contact_id:
        oc = session.get(OutreachContact, invite.outreach_contact_id)
        if oc:
            data["district_code"] = oc.district_code
            data["sector_code"] = oc.sector_code
            data["email"] = oc.email or invite.email
            data["contact_email"] = oc.email or invite.email
    return data


def funnel_for_campaign(session: Session, campaign_id: int) -> dict[str, int]:
    messages = session.exec(
        select(OnboardingCampaignMessage).where(
            OnboardingCampaignMessage.campaign_id == campaign_id
        )
    ).all()

    sent = 0
    opened = 0
    onboarded = 0
    partial = 0
    complete = 0

    for msg in messages:
        if msg.status in (
            MessageStatus.SENT,
            MessageStatus.DELIVERED,
            MessageStatus.READ,
        ) or (msg.status == MessageStatus.FAILED and msg.whatsapp_message_id):
            sent += 1

        invite = None
        if msg.enrollment_invite_id:
            invite = session.get(EnrollmentInvite, msg.enrollment_invite_id)
        if not invite:
            invite = session.exec(
                select(EnrollmentInvite)
                .where(EnrollmentInvite.campaign_message_id == msg.id)
                .order_by(EnrollmentInvite.created_at.desc())  # type: ignore[union-attr]
            ).first()

        company_id = msg.company_id or (invite.created_company_id if invite else None)
        if invite and invite.opened_at:
            opened += 1

        if company_id:
            company = session.get(Company, company_id)
            if company:
                if tab1_complete(company):
                    onboarded += 1
                pct = profile_completion_pct(company, session)
                if pct >= 100:
                    complete += 1
                elif tab1_complete(company):
                    partial += 1

    return {
        "sent": sent,
        "opened": opened,
        "onboarded": onboarded,
        "partial": partial,
        "complete": complete,
        "total": len(messages),
    }


def validate_phone_for_invite(invite: EnrollmentInvite, submitted_phone: str | None) -> bool:
    if not submitted_phone:
        return True
    key_invite = phone_digits_key(invite.phone)
    key_sub = phone_digits_key(normalize_phone(submitted_phone) or submitted_phone)
    return key_invite == key_sub
