"""Audit logging helper.

Call `record(session, user, action, ...)` from any router *before* the session
commit. The audit row is added to the same session so it commits or rolls back
together with the primary mutation.
"""
from typing import Any
from sqlmodel import Session
from app.models.audit import AuditLog
from app.models.user import User


def record(
    session: Session,
    actor: User | None,
    action: str,
    *,
    resource_type: str | None = None,
    resource_id: int | None = None,
    resource_name: str | None = None,
    details: dict[str, Any] | None = None,
) -> AuditLog:
    entry = AuditLog(
        user_id=actor.id if actor else None,
        user_email=actor.email if actor else None,
        user_role=actor.role.value if actor else None,
        user_name=actor.full_name if actor else None,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        resource_name=resource_name,
        details=details or {},
    )
    session.add(entry)
    return entry
