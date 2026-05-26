"""Launch and persist onboarding drive campaigns."""
from __future__ import annotations

import logging
import time
from datetime import datetime, timezone

from sqlmodel import Session, select

from app.config import Settings, get_settings
from app.core import audit
from app.core.onboarding_audience import AudienceRecipient, resolve_audience
from app.core.whatsapp import effective_dry_run, send_template_message
from app.data.whatsapp_templates import TEMPLATE_BY_ID
from app.database import engine
from app.models.onboarding_campaign import (
    CampaignStatus,
    MessageStatus,
    OnboardingCampaign,
    OnboardingCampaignMessage,
    RegistrationFilter,
)
from app.models.user import User

logger = logging.getLogger(__name__)


def create_campaign(
    session: Session,
    actor: User,
    *,
    name: str,
    template_id: str,
    language_code: str,
    district_code: str | None,
    sector_code: str | None,
    tag_filter: str | None,
    registration_filter: RegistrationFilter,
    outreach_contact_ids: list[int] | None = None,
) -> tuple[OnboardingCampaign, list[AudienceRecipient], str | None]:
    if template_id not in TEMPLATE_BY_ID:
        raise ValueError(f"unknown template: {template_id}")

    audience = resolve_audience(
        session,
        district_code=district_code,
        sector_code=sector_code,
        tag_filter=tag_filter,
        registration_filter=registration_filter,
        outreach_contact_ids=outreach_contact_ids,
    )
    if audience.warning and not audience.recipients:
        raise ValueError(audience.warning)
    if not audience.recipients:
        raise ValueError("no recipients match this audience (check phone numbers and filters)")

    campaign = OnboardingCampaign(
        name=name.strip(),
        template_id=template_id,
        language_code=language_code or "en",
        district_code=district_code or None,
        sector_code=sector_code or None,
        tag_filter=tag_filter,
        registration_filter=registration_filter,
        audience_label=audience.audience_label,
        status=CampaignStatus.RUNNING,
        launched_at=datetime.now(timezone.utc),
        created_by_user_id=actor.id,
        sent_count=0,
        delivered_count=0,
        responded_count=0,
    )
    session.add(campaign)
    session.flush()

    for recipient in audience.recipients:
        session.add(
            OnboardingCampaignMessage(
                campaign_id=campaign.id,  # type: ignore[arg-type]
                company_id=recipient.company_id,
                outreach_contact_id=recipient.outreach_contact_id,
                phone=recipient.phone,
                recipient_name=recipient.name,
                status=MessageStatus.PENDING,
            )
        )

    audit.record(
        session,
        actor,
        "onboarding_campaign.launch",
        resource_type="onboarding_campaign",
        resource_id=campaign.id,
        resource_name=campaign.name,
        details={
            "template_id": template_id,
            "language_code": language_code,
            "audience_label": audience.audience_label,
            "queued": len(audience.recipients),
        },
    )
    session.commit()
    session.refresh(campaign)
    return campaign, audience.recipients, audience.warning


def process_campaign_sends(campaign_id: int) -> None:
    """Background worker: send all pending messages for a campaign."""
    settings = get_settings()
    dry_run = effective_dry_run(settings)

    with Session(engine) as session:
        campaign = session.get(OnboardingCampaign, campaign_id)
        if not campaign:
            logger.error("campaign %s not found for send worker", campaign_id)
            return

        pending = session.exec(
            select(OnboardingCampaignMessage)
            .where(OnboardingCampaignMessage.campaign_id == campaign_id)
            .where(OnboardingCampaignMessage.status == MessageStatus.PENDING)
            .order_by(OnboardingCampaignMessage.id)  # type: ignore[union-attr]
        ).all()

        from app.core.whatsapp_webhook import refresh_campaign_stats

        delay = settings.whatsapp_send_delay_seconds
        sent = 0
        failed = 0

        for row in pending:
            result = send_template_message(
                settings,
                to_phone=row.phone,
                template_name=campaign.template_id,
                language_code=campaign.language_code,
                recipient_name=row.recipient_name,
                company_name=row.recipient_name,
            )
            if result.success:
                row.status = MessageStatus.SENT
                row.whatsapp_message_id = result.message_id or f"dry-run-{campaign_id}-{row.id}"
                sent += 1
            else:
                row.status = MessageStatus.FAILED
                row.error_message = result.error
                failed += 1
            row.updated_at = datetime.now(timezone.utc)
            session.add(row)
            session.flush()
            refresh_campaign_stats(session, campaign_id)
            session.commit()

            if delay > 0:
                time.sleep(delay)

        campaign = session.get(OnboardingCampaign, campaign_id)
        if campaign:
            if failed and sent == 0:
                campaign.status = CampaignStatus.FAILED
            elif sent > 0:
                campaign.status = CampaignStatus.RUNNING
            session.add(campaign)
            session.commit()

        logger.info(
            "campaign %s send worker done: sent=%s failed=%s dry_run=%s",
            campaign_id,
            sent,
            failed,
            dry_run,
        )


def launch_campaign(
    session: Session,
    actor: User,
    *,
    name: str,
    template_id: str,
    language_code: str = "en",
    district_code: str | None,
    sector_code: str | None,
    tag_filter: str | None,
    registration_filter: RegistrationFilter,
    outreach_contact_ids: list[int] | None = None,
    settings: Settings | None = None,
) -> tuple[OnboardingCampaign, int, bool, str | None]:
    """Create campaign + queue; caller should schedule process_campaign_sends."""
    _ = settings
    campaign, recipients, warning = create_campaign(
        session,
        actor,
        name=name,
        template_id=template_id,
        language_code=language_code,
        district_code=district_code,
        sector_code=sector_code,
        tag_filter=tag_filter,
        registration_filter=registration_filter,
        outreach_contact_ids=outreach_contact_ids,
    )
    dry_run = effective_dry_run(get_settings())
    return campaign, len(recipients), dry_run, warning


def list_campaigns(session: Session) -> list[OnboardingCampaign]:
    return list(
        session.exec(
            select(OnboardingCampaign).order_by(OnboardingCampaign.created_at.desc())  # type: ignore[union-attr]
        ).all()
    )
