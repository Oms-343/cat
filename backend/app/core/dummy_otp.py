"""In-memory OTP challenges for dev/demo auth (no real email)."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Literal

from app.config import get_settings

ChallengeKind = Literal["signup", "password_reset"]


@dataclass
class OtpChallenge:
    email: str
    kind: ChallengeKind
    otp: str
    expires_at: datetime
  # signup only
    password_hash: str | None = None
    full_name: str | None = None
    role: str | None = None
    extra: dict = field(default_factory=dict)


_store: dict[str, OtpChallenge] = {}


def _key(email: str, kind: ChallengeKind) -> str:
    return f"{kind}:{email.lower()}"


def issue_otp(
    email: str,
    kind: ChallengeKind,
    *,
    password_hash: str | None = None,
    full_name: str | None = None,
    role: str | None = None,
    extra: dict | None = None,
) -> str:
    settings = get_settings()
    otp = settings.dummy_otp_code
    _store[_key(email, kind)] = OtpChallenge(
        email=email.lower(),
        kind=kind,
        otp=otp,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.dummy_otp_expire_minutes),
        password_hash=password_hash,
        full_name=full_name,
        role=role,
        extra=extra or {},
    )
    return otp


def verify_otp(email: str, kind: ChallengeKind, code: str) -> OtpChallenge:
    key = _key(email, kind)
    ch = _store.get(key)
    if not ch:
        raise ValueError("no pending verification for this email")
    if datetime.now(timezone.utc) > ch.expires_at:
        _store.pop(key, None)
        raise ValueError("verification code expired — request a new one")
    if ch.otp != code.strip():
        raise ValueError("invalid verification code")
    _store.pop(key, None)
    return ch


def peek_challenge(email: str, kind: ChallengeKind) -> OtpChallenge | None:
    return _store.get(_key(email, kind))
