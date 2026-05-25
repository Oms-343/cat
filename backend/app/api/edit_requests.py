from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select

from app.core import audit
from app.deps import CurrentUser, SessionDep, require_roles
from app.models.audit import Action
from app.models.company import LOCKED_FIELDS_FOR_MSME, Company
from app.models.edit_request import CompanyEditRequest, EditRequestStatus
from app.models.user import User, UserRole
from app.schemas.edit_request import EditRequestCreate, EditRequestOut, EditRequestReview

router = APIRouter(prefix="/api/companies", tags=["edit-requests"])


def _to_out(req: CompanyEditRequest, session) -> EditRequestOut:
    company = session.get(Company, req.company_id)
    requester = session.get(User, req.requested_by_user_id)
    reviewer = session.get(User, req.reviewed_by_user_id) if req.reviewed_by_user_id else None
    return EditRequestOut(
        id=req.id,  # type: ignore[arg-type]
        company_id=req.company_id,
        company_name=company.name if company else None,
        requested_by_user_id=req.requested_by_user_id,
        requested_by_name=requester.full_name if requester else None,
        status=req.status,
        proposed_changes=req.proposed_changes,
        review_note=req.review_note,
        reviewed_by_name=reviewer.full_name if reviewer else None,
        created_at=req.created_at,
        reviewed_at=req.reviewed_at,
    )


@router.get("/edit-requests/pending", response_model=list[EditRequestOut])
def list_pending(
    session: SessionDep,
    _: User = Depends(require_roles(UserRole.ADMIN)),
) -> list[EditRequestOut]:
    rows = session.exec(
        select(CompanyEditRequest)
        .where(CompanyEditRequest.status == EditRequestStatus.PENDING)
        .order_by(CompanyEditRequest.created_at.desc())
    ).all()
    return [_to_out(r, session) for r in rows]


@router.post("/{company_id}/edit-requests", response_model=EditRequestOut, status_code=201)
def create_edit_request(
    company_id: int,
    payload: EditRequestCreate,
    session: SessionDep,
    user: CurrentUser,
) -> EditRequestOut:
    company = session.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="company not found")

    if user.role == UserRole.MSME and company.owner_user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="not your company")

    changes = payload.proposed_changes
    if not changes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="no changes proposed")

    if user.role != UserRole.MSME:
        invalid = set(changes.keys()) - LOCKED_FIELDS_FOR_MSME
        if invalid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="officials can edit locked fields directly on the profile",
            )
    else:
        invalid = set(changes.keys()) - LOCKED_FIELDS_FOR_MSME
        if invalid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"only locked govt fields can be requested: {sorted(LOCKED_FIELDS_FOR_MSME)}",
            )

    req = CompanyEditRequest(
        company_id=company_id,
        requested_by_user_id=user.id,
        proposed_changes=changes,
    )
    session.add(req)
    session.flush()
    audit.record(
        session,
        user,
        Action.EDIT_REQUEST_CREATED,
        resource_type="company",
        resource_id=company_id,
        resource_name=company.name,
        details={"request_id": req.id, "fields": list(changes.keys())},
    )
    session.commit()
    session.refresh(req)
    return _to_out(req, session)


@router.post(
    "/edit-requests/{request_id}/review",
    response_model=EditRequestOut,
)
def review_edit_request(
    request_id: int,
    payload: EditRequestReview,
    session: SessionDep,
    actor: User = Depends(require_roles(UserRole.ADMIN)),
) -> EditRequestOut:
    req = session.get(CompanyEditRequest, request_id)
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="request not found")
    if req.status != EditRequestStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="request already reviewed")

    company = session.get(Company, req.company_id)
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="company not found")

    req.reviewed_by_user_id = actor.id
    req.review_note = payload.review_note
    req.reviewed_at = datetime.now(timezone.utc)

    if payload.approve:
        for field, value in req.proposed_changes.items():
            if hasattr(company, field):
                setattr(company, field, value)
        company.updated_at = datetime.now(timezone.utc)
        req.status = EditRequestStatus.APPROVED
        audit.record(
            session,
            actor,
            Action.EDIT_REQUEST_APPROVED,
            resource_type="company",
            resource_id=company.id,
            resource_name=company.name,
            details={"request_id": req.id, "fields": list(req.proposed_changes.keys())},
        )
    else:
        req.status = EditRequestStatus.REJECTED
        audit.record(
            session,
            actor,
            Action.EDIT_REQUEST_REJECTED,
            resource_type="company",
            resource_id=company.id,
            resource_name=company.name,
            details={"request_id": req.id, "note": payload.review_note},
        )

    session.add(company)
    session.add(req)
    session.commit()
    session.refresh(req)
    return _to_out(req, session)
