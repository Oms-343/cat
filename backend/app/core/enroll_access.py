"""Resolve company + invite for token-gated enrollment (no MSME portal login)."""
from __future__ import annotations

from fastapi import HTTPException, status
from sqlmodel import Session

from app.core.enrollment import get_invite_by_token, invite_is_usable
from app.models.company import Company
from app.models.enrollment_invite import EnrollmentInvite


def load_invite(session: Session, token: str) -> EnrollmentInvite:
    invite = get_invite_by_token(session, token)
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="enrollment link not found",
        )
    return invite


def require_usable_invite(session: Session, token: str) -> EnrollmentInvite:
    invite = load_invite(session, token)
    usable, err = invite_is_usable(invite)
    if not usable:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err or "invalid link",
        )
    return invite


def company_id_for_invite(invite: EnrollmentInvite) -> int | None:
    return invite.created_company_id or invite.company_id


def require_company_for_invite(session: Session, token: str) -> tuple[EnrollmentInvite, Company]:
    invite = require_usable_invite(session, token)
    company_id = company_id_for_invite(invite)
    if not company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="complete Tab 1 before updating additional profile sections",
        )
    company = session.get(Company, company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="company not found",
        )
    return invite, company
