"""Public enrollment API (token-gated, no admin or MSME portal JWT)."""
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from app.core import audit
from app.core.company_completion import (
    profile_completion_pct,
    section_completion,
    tab1_complete,
    tab1_missing_fields,
)
from app.core.enroll_access import (
    company_id_for_invite,
    load_invite,
    require_company_for_invite,
    require_usable_invite,
)
from app.core.enrollment import (
    build_prefill,
    invite_is_usable,
    mark_invite_opened,
    validate_phone_for_invite,
)
from app.core.phone import normalize_phone
from app.deps import SessionDep
from app.models.company import Company
from app.models.master import MASTERS, TalukMaster
from app.models.enrollment_invite import EnrollmentInvite, InviteStatus
from app.models.onboarding_campaign import OnboardingCampaignMessage
from app.models.outreach_contact import OutreachContact
from app.schemas.company import CompanyOut
from app.schemas.enrollment import (
    EnrollInviteOut,
    EnrollPrefillOut,
    EnrollTab1Request,
    EnrollTab1Response,
    EnrollTagsUpdate,
)
from app.api.companies import _to_out

router = APIRouter(prefix="/api/enroll", tags=["enrollment"])

ENROLL_MASTER_KEYS = frozenset({
    "districts",
    "sectors",
    "turnover-ranges",
    "legal-structures",
    "certifications",
    "production-capacities",
})


@router.get("/meta/taluks/{district_code}")
def list_enroll_taluks(district_code: str, session: SessionDep) -> list[dict]:
    rows = session.exec(
        select(TalukMaster)
        .where(TalukMaster.district_code == district_code)
        .where(TalukMaster.is_active == True)  # noqa: E712
        .order_by(TalukMaster.sort_order, TalukMaster.name)  # type: ignore[attr-defined]
    ).all()
    return [{"code": r.code, "name": r.name} for r in rows]


@router.get("/meta/{key}")
def list_enroll_master_options(key: str, session: SessionDep) -> list[dict]:
    if key not in ENROLL_MASTER_KEYS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="unknown master key")
    cfg = MASTERS[key]
    model = cfg["model"]
    rows = session.exec(
        select(model)
        .where(model.is_active == True)  # noqa: E712
        .order_by(model.sort_order, model.name)  # type: ignore[attr-defined]
    ).all()
    return [{"code": r.code, "name": r.name} for r in rows]


def _invite_state(session: SessionDep, invite: EnrollmentInvite) -> dict:
    company_id = company_id_for_invite(invite)
    usable, _ = invite_is_usable(invite)
    tab1_done = False
    pct: int | None = None
    sc: dict[str, bool] | None = None
    if company_id:
        company = session.get(Company, company_id)
        if company:
            tab1_done = tab1_complete(company)
            sc = section_completion(company, session)
            pct = profile_completion_pct(company, session)
    return {
        "company_id": company_id,
        "tab1_complete": tab1_done,
        "can_submit_tab1": usable and invite.status == InviteStatus.ACTIVE and not tab1_done,
        "can_access_tab2": bool(company_id and tab1_done and usable),
        "profile_completion": pct,
        "section_completion": sc,
    }


@router.get("/{token}", response_model=EnrollInviteOut)
def get_enrollment_invite(token: str, session: SessionDep) -> EnrollInviteOut:
    invite = load_invite(session, token)
    mark_invite_opened(session, invite)
    session.commit()
    session.refresh(invite)

    prefill_raw = build_prefill(session, invite)
    state = _invite_state(session, invite)

    return EnrollInviteOut(
        token=invite.token,
        kind=invite.kind,
        status=invite.status,
        recipient_name=invite.recipient_name,
        prefill=EnrollPrefillOut(**prefill_raw),
        expires_at=invite.expires_at,
        **state,
    )


@router.get("/{token}/company", response_model=CompanyOut)
def get_enroll_company(token: str, session: SessionDep) -> CompanyOut:
    _invite, company = require_company_for_invite(session, token)
    return _to_out(company, session)


@router.post("/{token}/tab1", response_model=EnrollTab1Response)
def submit_tab1(token: str, payload: EnrollTab1Request, session: SessionDep) -> EnrollTab1Response:
    invite = require_usable_invite(session, token)

    phone = normalize_phone(payload.contact_phone or invite.phone) or invite.phone
    if not validate_phone_for_invite(invite, phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="phone number does not match this invitation",
        )

    if payload.gst_number:
        existing_gst = session.exec(
            select(Company).where(Company.gst_number == payload.gst_number)
        ).first()
        cid = company_id_for_invite(invite)
        if existing_gst and existing_gst.id != cid:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"company with GST {payload.gst_number} already exists",
            )

    now = datetime.now(timezone.utc)
    company_data = payload.model_dump()
    company_data["contact_phone"] = phone
    company_data["contact_email"] = (
        str(payload.contact_email) if payload.contact_email else None
    )
    company_data["contact_name"] = payload.contact_name or payload.name

    company_id = company_id_for_invite(invite)
    if company_id:
        company = session.get(Company, company_id)
        if not company:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="company not found")
        for field, value in company_data.items():
            setattr(company, field, value)
        company.updated_at = now
        session.add(company)
    else:
        company = Company(**company_data)
        session.add(company)
        session.flush()
        invite.created_company_id = company.id
        if invite.campaign_message_id:
            msg = session.get(OnboardingCampaignMessage, invite.campaign_message_id)
            if msg:
                msg.company_id = company.id
                msg.updated_at = now
                session.add(msg)

    if not tab1_complete(company):
        missing = tab1_missing_fields(company)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"complete all required Tab 1 fields: {', '.join(missing)}",
        )

    invite.tab1_submitted_at = now
    session.add(invite)

    if invite.outreach_contact_id and not company_id:
        oc = session.get(OutreachContact, invite.outreach_contact_id)
        if oc:
            oc.converted_company_id = company.id
            oc.is_active = False
            oc.updated_at = now
            session.add(oc)

    audit.record(
        session,
        None,
        "enrollment.tab1_completed",
        resource_type="company",
        resource_id=company.id,
        resource_name=company.name,
        details={"invite_token": token, "campaign_message_id": invite.campaign_message_id},
    )

    session.commit()
    session.refresh(company)

    sc = section_completion(company, session)
    pct = profile_completion_pct(company, session)
    return EnrollTab1Response(
        company_id=company.id,  # type: ignore[arg-type]
        tab1_complete=True,
        profile_completion=pct,
        section_completion=sc,
        message="Core details saved. You can add optional products and other details in Tab 2.",
    )


@router.patch("/{token}/tags", response_model=CompanyOut)
def update_enroll_tags(
    token: str, payload: EnrollTagsUpdate, session: SessionDep
) -> CompanyOut:
    _invite, company = require_company_for_invite(session, token)
    company.tags = payload.tags
    company.updated_at = datetime.now(timezone.utc)
    session.add(company)
    audit.record(
        session,
        None,
        "enrollment.tags_updated",
        resource_type="company",
        resource_id=company.id,
        resource_name=company.name,
        details={"invite_token": token, "tags": payload.tags},
    )
    session.commit()
    session.refresh(company)
    return _to_out(company, session)
