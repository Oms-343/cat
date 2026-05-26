"""Meta WhatsApp webhook (no JWT — verified via hub token + optional HMAC)."""
import json
import logging

from fastapi import APIRouter, HTTPException, Query, Request, Response, status

from app.config import get_settings
from app.core.whatsapp_webhook import process_webhook_payload, verify_webhook_signature
from app.database import engine
from sqlmodel import Session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp"])


@router.get("/webhook")
def verify_webhook(
    hub_mode: str | None = Query(None, alias="hub.mode"),
    hub_verify_token: str | None = Query(None, alias="hub.verify_token"),
    hub_challenge: str | None = Query(None, alias="hub.challenge"),
) -> Response:
    settings = get_settings()
    if hub_mode == "subscribe" and hub_verify_token == settings.whatsapp_webhook_verify_token:
        return Response(content=hub_challenge or "", media_type="text/plain")
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="verification failed")


@router.post("/webhook")
async def receive_webhook(request: Request) -> dict[str, str | int]:
    settings = get_settings()
    raw = await request.body()
    signature = request.headers.get("X-Hub-Signature-256")
    if not verify_webhook_signature(raw, signature, settings.whatsapp_app_secret):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="invalid signature")

    try:
        body = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid json") from exc

    with Session(engine) as session:
        counts = process_webhook_payload(session, body)

    logger.info("whatsapp webhook processed: %s", counts)
    return {"status": "ok", **counts}
