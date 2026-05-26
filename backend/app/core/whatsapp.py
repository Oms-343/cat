"""WhatsApp Cloud API client (Meta Graph API)."""
from dataclasses import dataclass

import httpx

from app.config import Settings
from app.data.whatsapp_template_params import resolve_template_params


@dataclass
class SendResult:
    success: bool
    message_id: str | None
    error: str | None = None


def whatsapp_is_configured(settings: Settings) -> bool:
    return bool(settings.whatsapp_access_token and settings.whatsapp_phone_number_id)


def effective_dry_run(settings: Settings) -> bool:
    """Send for real only when credentials exist and dry_run is explicitly disabled."""
    if settings.whatsapp_dry_run:
        return True
    return not whatsapp_is_configured(settings)


def _build_template_payload(
    settings: Settings,
    *,
    template_name: str,
    language_code: str,
    recipient_name: str,
    company_name: str,
) -> dict:
    params = resolve_template_params(
        template_name,
        recipient_name=recipient_name,
        registration_url=settings.platform_registration_url,
    )
    components = []
    if params:
        components.append(
            {
                "type": "body",
                "parameters": [{"type": "text", "text": p} for p in params],
            }
        )
    return {
        "name": template_name,
        "language": {"code": language_code},
        "components": components,
    }


def send_template_message(
    settings: Settings,
    *,
    to_phone: str,
    template_name: str,
    language_code: str = "en",
    recipient_name: str = "MSME",
    company_name: str | None = None,
) -> SendResult:
    if effective_dry_run(settings):
        return SendResult(success=True, message_id=None)

    url = (
        f"https://graph.facebook.com/{settings.whatsapp_api_version}/"
        f"{settings.whatsapp_phone_number_id}/messages"
    )
    template = _build_template_payload(
        settings,
        template_name=template_name,
        language_code=language_code,
        recipient_name=recipient_name,
        company_name=company_name or recipient_name,
    )
    payload = {
        "messaging_product": "whatsapp",
        "to": to_phone.lstrip("+"),
        "type": "template",
        "template": template,
    }
    headers = {"Authorization": f"Bearer {settings.whatsapp_access_token}"}
    try:
        with httpx.Client(timeout=30.0) as client:
            res = client.post(url, json=payload, headers=headers)
        if res.status_code >= 400:
            detail = res.text[:500]
            return SendResult(success=False, message_id=None, error=detail)
        data = res.json()
        msg_id = (data.get("messages") or [{}])[0].get("id")
        return SendResult(success=True, message_id=msg_id)
    except httpx.HTTPError as exc:
        return SendResult(success=False, message_id=None, error=str(exc))
