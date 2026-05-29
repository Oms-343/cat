from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, status

from app.config import get_settings
from app.core.onboarding_audience import resolve_audience
from app.core.enrollment import funnel_for_campaign
from app.core.onboarding_campaigns import (
    launch_campaign,
    list_campaigns,
    process_campaign_sends,
    remind_campaign_cohort,
)
from app.core.outreach_contacts import (
    count_active_contacts,
    import_contacts_csv,
    import_contacts_xlsx,
)
from app.core.whatsapp_webhook import simulate_campaign_progress
from app.core.whatsapp import effective_dry_run, whatsapp_is_configured
from app.data.whatsapp_templates import WHATSAPP_TEMPLATES, TEMPLATE_BY_ID
from app.deps import SessionDep, require_roles
from app.models.onboarding_campaign import OnboardingCampaign
from app.models.user import User, UserRole
from app.schemas.enrollment import CampaignFunnelOut, CampaignRemindIn, CampaignRemindOut
from app.schemas.onboarding_drive import (
    AudienceEstimateIn,
    AudienceEstimateOut,
    CampaignCreateIn,
    CampaignLaunchOut,
    CampaignListOut,
    CampaignOut,
    CampaignSimulateIn,
    CampaignSimulateOut,
    CampaignSummaryOut,
    ContactsImportOut,
    OnboardingConfigOut,
    OutreachContactsOut,
    WhatsAppTemplateOut,
)

router = APIRouter(
    prefix="/api/onboarding-drives",
    tags=["onboarding-drives"],
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)


def _campaign_to_out(c, *, dry_run: bool) -> CampaignOut:
    template = TEMPLATE_BY_ID.get(c.template_id)
    launched = c.launched_at.isoformat()[:10] if c.launched_at else None
    return CampaignOut(
        id=c.id,
        name=c.name,
        template_id=c.template_id,
        template_name=template["name"] if template else None,
        audience_label=c.audience_label,
        sent=c.sent_count,
        delivered_pct=round(c.delivered_count * 100 / c.sent_count) if c.sent_count else 0,
        responded=c.responded_count,
        status=c.status,
        launched_at=launched,
        dry_run=dry_run,
    )


@router.get("/config", response_model=OnboardingConfigOut)
def get_config(session: SessionDep) -> OnboardingConfigOut:
    settings = get_settings()
    outreach_count = count_active_contacts(session)
    return OnboardingConfigOut(
        dry_run=effective_dry_run(settings),
        whatsapp_configured=whatsapp_is_configured(settings),
        unregistered_audience_available=outreach_count > 0,
        outreach_contacts_count=outreach_count,
        webhook_url=settings.whatsapp_webhook_url,
        enroll_public_url=settings.enroll_public_url,
        webhook_verify_token_set=bool(settings.whatsapp_webhook_verify_token),
        webhook_signature_verification=bool(settings.whatsapp_app_secret),
    )


@router.get("/contacts", response_model=OutreachContactsOut)
def get_outreach_contacts(session: SessionDep) -> OutreachContactsOut:
    return OutreachContactsOut(total_active=count_active_contacts(session))


@router.post("/contacts/import", response_model=ContactsImportOut)
async def import_outreach_contacts(
    session: SessionDep,
    file: UploadFile = File(...),
) -> ContactsImportOut:
    filename = (file.filename or "").lower()
    if not filename.endswith((".csv", ".xlsx", ".xlsm")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "upload a CSV or Excel (.xlsx) file with columns: "
                "name, phone, district_code, sector_code"
            ),
        )
    raw = await file.read()
    try:
        if filename.endswith(".csv"):
            result = import_contacts_csv(session, raw.decode("utf-8-sig"))
        else:
            result = import_contacts_xlsx(session, raw)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"import failed: {exc}",
        ) from exc
    return ContactsImportOut(**result)


@router.get("/templates", response_model=list[WhatsAppTemplateOut])
def list_templates() -> list[WhatsAppTemplateOut]:
    return [
        WhatsAppTemplateOut(
            id=t["id"],
            name=t["name"],
            purpose=t["purpose"],
            languages=t["languages"],
            preview_en=t["preview_en"],
            preview_ta=t["preview_ta"],
        )
        for t in WHATSAPP_TEMPLATES
    ]


@router.get("/campaigns", response_model=CampaignListOut)
def get_campaigns(session: SessionDep) -> CampaignListOut:
    settings = get_settings()
    dry_run = effective_dry_run(settings)
    rows = list_campaigns(session)
    items = [_campaign_to_out(c, dry_run=dry_run) for c in rows]
    total_sent = sum(c.sent_count for c in rows)
    total_responded = sum(c.responded_count for c in rows)
    avg_delivery = (
        round(sum(_campaign_to_out(c, dry_run=dry_run).delivered_pct for c in rows) / len(rows))
        if rows
        else 0
    )
    return CampaignListOut(
        items=items,
        summary=CampaignSummaryOut(
            campaign_count=len(rows),
            total_sent=total_sent,
            total_responded=total_responded,
            avg_delivery_pct=avg_delivery,
        ),
    )


@router.post("/campaigns/estimate", response_model=AudienceEstimateOut)
def estimate_audience(session: SessionDep, body: AudienceEstimateIn) -> AudienceEstimateOut:
    audience = resolve_audience(
        session,
        district_code=body.district_code or None,
        sector_code=body.sector_code or None,
        registration_filter=body.registration_filter,
        outreach_contact_ids=body.outreach_contact_ids or None,
    )
    stmt_count = len(audience.recipients)
    return AudienceEstimateOut(
        count=stmt_count,
        with_phone=stmt_count,
        audience_label=audience.audience_label,
        warning=audience.warning,
    )


@router.post("/campaigns", response_model=CampaignLaunchOut, status_code=status.HTTP_201_CREATED)
def create_and_launch_campaign(
    session: SessionDep,
    body: CampaignCreateIn,
    background_tasks: BackgroundTasks,
    actor: User = Depends(require_roles(UserRole.ADMIN)),
) -> CampaignLaunchOut:
    settings = get_settings()
    dry_run = effective_dry_run(settings)
    if body.language_code not in ("en", "ta"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="language_code must be en or ta")
    template = TEMPLATE_BY_ID.get(body.template_id)
    if template and body.language_code not in template["languages"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"template does not support language {body.language_code}",
        )

    try:
        campaign, queued, _, warning = launch_campaign(
            session,
            actor,
            name=body.name,
            template_id=body.template_id,
            language_code=body.language_code,
            district_code=body.district_code or None,
            sector_code=body.sector_code or None,
            registration_filter=body.registration_filter,
            outreach_contact_ids=body.outreach_contact_ids or None,
            settings=settings,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    background_tasks.add_task(process_campaign_sends, campaign.id)

    session.refresh(campaign)
    out = _campaign_to_out(campaign, dry_run=dry_run)
    if dry_run:
        msg = (
            f'Campaign "{campaign.name}" queued ({queued} recipients). '
            "Sending in background (dry-run). Use Simulate delivery when complete."
        )
    else:
        msg = (
            f'Campaign "{campaign.name}" queued ({queued} recipients). '
            "Sending in background; delivery stats update via webhook."
        )
    if warning:
        msg = f"{msg} Note: {warning}"

    return CampaignLaunchOut(
        campaign=out,
        messages_queued=queued,
        dry_run=dry_run,
        message=msg,
    )


@router.post("/campaigns/{campaign_id}/simulate", response_model=CampaignSimulateOut)
def simulate_webhook_updates(
    session: SessionDep,
    campaign_id: int,
    body: CampaignSimulateIn,
) -> CampaignSimulateOut:
    """Progress delivery/response stats (dry-run or local dev without Meta tunnel)."""
    if body.step not in ("delivered", "read", "reply"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="step must be one of: delivered, read, reply",
        )
    campaign = session.get(OnboardingCampaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="campaign not found")
    try:
        updated = simulate_campaign_progress(session, campaign_id, step=body.step)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    session.refresh(campaign)
    settings = get_settings()
    return CampaignSimulateOut(
        updated=updated,
        campaign=_campaign_to_out(campaign, dry_run=effective_dry_run(settings)),
    )


@router.get("/campaigns/{campaign_id}/funnel", response_model=CampaignFunnelOut)
def get_campaign_funnel(session: SessionDep, campaign_id: int) -> CampaignFunnelOut:
    campaign = session.get(OnboardingCampaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="campaign not found")
    stats = funnel_for_campaign(session, campaign_id)
    return CampaignFunnelOut(**stats)


@router.post("/campaigns/{campaign_id}/remind", response_model=CampaignRemindOut)
def remind_campaign(
    session: SessionDep,
    campaign_id: int,
    body: CampaignRemindIn,
    background_tasks: BackgroundTasks,
    actor: User = Depends(require_roles(UserRole.ADMIN)),
) -> CampaignRemindOut:
    if body.cohort not in ("not_onboarded", "partial"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="cohort must be not_onboarded or partial",
        )
    try:
        created, queued = remind_campaign_cohort(
            session,
            actor,
            campaign_id,
            cohort=body.cohort,
            message_ids=body.message_ids,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if queued:
        background_tasks.add_task(process_campaign_sends, campaign_id)
    return CampaignRemindOut(invites_created=created, queued=queued)
