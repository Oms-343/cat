"""Process Meta WhatsApp Cloud API webhooks (delivery status + inbound replies)."""
from __future__ import annotations

import hashlib
import hmac
import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlmodel import Session, select

from app.config import Settings, get_settings
from app.core.phone import normalize_phone, phone_digits_key
from app.models.onboarding_campaign import (
    CampaignStatus,
    MessageStatus,
    OnboardingCampaign,
    OnboardingCampaignMessage,
)

logger = logging.getLogger(__name__)

_STATUS_RANK = {
    MessageStatus.PENDING: 0,
    MessageStatus.SENT: 1,
    MessageStatus.DELIVERED: 2,
    MessageStatus.READ: 3,
    MessageStatus.FAILED: -1,
}

_META_STATUS_MAP = {
    "sent": MessageStatus.SENT,
    "delivered": MessageStatus.DELIVERED,
    "read": MessageStatus.READ,
    "failed": MessageStatus.FAILED,
}


def verify_webhook_signature(payload: bytes, signature_header: str | None, app_secret: str | None) -> bool:
    if not app_secret:
        return True
    if not signature_header or not signature_header.startswith("sha256="):
        return False
    expected = hmac.new(app_secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(signature_header, f"sha256={expected}")


def _should_advance(current: MessageStatus, new: MessageStatus) -> bool:
    if new == MessageStatus.FAILED:
        return current != MessageStatus.READ
    if current == MessageStatus.FAILED:
        return False
    return _STATUS_RANK.get(new, 0) > _STATUS_RANK.get(current, 0)


def refresh_campaign_stats(session: Session, campaign_id: int) -> OnboardingCampaign | None:
    campaign = session.get(OnboardingCampaign, campaign_id)
    if not campaign:
        return None

    messages = session.exec(
        select(OnboardingCampaignMessage).where(
            OnboardingCampaignMessage.campaign_id == campaign_id
        )
    ).all()

    sent = 0
    delivered = 0
    responded = 0
    pending_or_sent = 0

    for m in messages:
        if m.status == MessageStatus.FAILED:
            if m.whatsapp_message_id:
                sent += 1
            continue
        if m.status in (MessageStatus.SENT, MessageStatus.DELIVERED, MessageStatus.READ):
            sent += 1
        if m.status in (MessageStatus.DELIVERED, MessageStatus.READ):
            delivered += 1
        if m.responded_at is not None:
            responded += 1
        if m.status in (MessageStatus.PENDING, MessageStatus.SENT):
            pending_or_sent += 1

    campaign.sent_count = sent
    campaign.delivered_count = delivered
    campaign.responded_count = responded

    if campaign.status == CampaignStatus.FAILED:
        session.add(campaign)
        return campaign

    if pending_or_sent > 0 and campaign.status != CampaignStatus.DRAFT:
        campaign.status = CampaignStatus.RUNNING
    elif sent > 0 and pending_or_sent == 0:
        campaign.status = CampaignStatus.COMPLETED

    session.add(campaign)
    return campaign


def apply_status_update(
    session: Session,
    *,
    whatsapp_message_id: str,
    meta_status: str,
    error_message: str | None = None,
) -> bool:
    new_status = _META_STATUS_MAP.get(meta_status.lower())
    if not new_status:
        return False

    row = session.exec(
        select(OnboardingCampaignMessage).where(
            OnboardingCampaignMessage.whatsapp_message_id == whatsapp_message_id
        )
    ).first()
    if not row:
        logger.debug("webhook status for unknown message id %s", whatsapp_message_id)
        return False

    if _should_advance(row.status, new_status):
        row.status = new_status
        if error_message:
            row.error_message = error_message
        row.updated_at = datetime.now(timezone.utc)
        session.add(row)
        refresh_campaign_stats(session, row.campaign_id)
        session.commit()
        return True
    return False


def apply_inbound_reply(session: Session, *, from_phone: str, settings: Settings | None = None) -> bool:
    settings = settings or get_settings()
    normalized = normalize_phone(from_phone) or (
        f"+{phone_digits_key(from_phone)}" if phone_digits_key(from_phone) else None
    )
    if not normalized:
        return False

    key = phone_digits_key(normalized)
    window_start = datetime.now(timezone.utc) - timedelta(days=settings.whatsapp_response_window_days)

    candidates = session.exec(
        select(OnboardingCampaignMessage)
        .where(OnboardingCampaignMessage.responded_at.is_(None))  # type: ignore[union-attr]
        .where(OnboardingCampaignMessage.status.in_(  # type: ignore[attr-defined]
            [MessageStatus.SENT, MessageStatus.DELIVERED, MessageStatus.READ]
        ))
        .order_by(OnboardingCampaignMessage.created_at.desc())  # type: ignore[union-attr]
    ).all()

    row: OnboardingCampaignMessage | None = None
    for c in candidates:
        if phone_digits_key(c.phone) == key and c.created_at >= window_start:
            row = c
            break

    if not row:
        logger.debug("inbound reply from %s — no matching campaign message", from_phone)
        return False

    now = datetime.now(timezone.utc)
    row.responded_at = now
    row.updated_at = now
    if _should_advance(row.status, MessageStatus.READ):
        row.status = MessageStatus.READ
    session.add(row)
    refresh_campaign_stats(session, row.campaign_id)
    session.commit()
    return True


def process_webhook_payload(session: Session, body: dict[str, Any]) -> dict[str, int]:
    """Parse Meta webhook JSON; return counts of handled events."""
    counts = {"statuses": 0, "inbound": 0}
    if body.get("object") != "whatsapp_business_account":
        return counts

    settings = get_settings()
    for entry in body.get("entry") or []:
        for change in entry.get("changes") or []:
            value = change.get("value") or {}
            metadata = value.get("metadata") or {}
            phone_number_id = metadata.get("phone_number_id")
            if (
                settings.whatsapp_phone_number_id
                and phone_number_id
                and phone_number_id != settings.whatsapp_phone_number_id
            ):
                continue

            for st in value.get("statuses") or []:
                wamid = st.get("id")
                status = st.get("status")
                if not wamid or not status:
                    continue
                errors = st.get("errors") or []
                err_msg = None
                if errors:
                    err_msg = str(errors[0].get("title") or errors[0])
                if apply_status_update(
                    session,
                    whatsapp_message_id=wamid,
                    meta_status=status,
                    error_message=err_msg,
                ):
                    counts["statuses"] += 1

            for msg in value.get("messages") or []:
                if msg.get("type") not in (None, "text", "button", "interactive"):
                    continue
                sender = msg.get("from")
                if not sender:
                    continue
                if apply_inbound_reply(session, from_phone=str(sender), settings=settings):
                    counts["inbound"] += 1

    return counts


def simulate_campaign_progress(
    session: Session,
    campaign_id: int,
    *,
    step: str,
) -> int:
    """Advance dry-run / test campaign messages (dev helper when Meta webhooks are unavailable)."""
    campaign = session.get(OnboardingCampaign, campaign_id)
    if not campaign:
        raise ValueError("campaign not found")

    messages = session.exec(
        select(OnboardingCampaignMessage).where(
            OnboardingCampaignMessage.campaign_id == campaign_id
        )
    ).all()
    updated = 0
    now = datetime.now(timezone.utc)

    for m in messages:
        if step == "delivered" and m.status == MessageStatus.SENT:
            m.status = MessageStatus.DELIVERED
            m.updated_at = now
            updated += 1
        elif step == "read" and m.status in (MessageStatus.SENT, MessageStatus.DELIVERED):
            m.status = MessageStatus.READ
            m.updated_at = now
            updated += 1
        elif step == "reply" and m.responded_at is None and m.status in (
            MessageStatus.SENT,
            MessageStatus.DELIVERED,
            MessageStatus.READ,
        ):
            m.responded_at = now
            m.status = MessageStatus.READ
            m.updated_at = now
            updated += 1
        session.add(m)

    refresh_campaign_stats(session, campaign_id)
    session.commit()
    return updated
