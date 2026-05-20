from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from pydantic import BaseModel
from sqlmodel import func, or_, select

from app.core.company_completion import profile_completion_pct, section_completion
from app.core.company_export import companies_to_xlsx
from app.core import audit
from app.deps import CurrentUser, SessionDep, require_roles
from app.models.audit import Action
from app.models.company import LOCKED_FIELDS_FOR_MSME, TAG_EDIT_ROLES, Company
from app.models.user import User, UserRole
from app.schemas.company import (
    CompanyCreate,
    CompanyListItem,
    CompanyListResponse,
    CompanyOut,
    CompanyUpdate,
    LockedFieldsResponse,
)

router = APIRouter(prefix="/api/companies", tags=["companies"])


def _to_out(c: Company, session) -> CompanyOut:
    sc = section_completion(c, session)
    return CompanyOut(
        **c.model_dump(),
        profile_completion=profile_completion_pct(c, session),
        section_completion=sc,
    )


def _to_list_item(c: Company, session) -> CompanyListItem:
    sc = section_completion(c, session)
    return CompanyListItem(
        id=c.id,  # type: ignore[arg-type]
        name=c.name,
        gst_number=c.gst_number,
        sector_code=c.sector_code,
        district_code=c.district_code,
        turnover_range_code=c.turnover_range_code,
        tags=list(c.tags or []),
        profile_completion=profile_completion_pct(c, session),
        is_mnc=c.is_mnc,
    )


@router.get("/locked-fields", response_model=LockedFieldsResponse)
def locked_fields(_user: CurrentUser) -> LockedFieldsResponse:
    return LockedFieldsResponse(
        locked_for_msme=sorted(LOCKED_FIELDS_FOR_MSME),
        tag_edit_roles=sorted(TAG_EDIT_ROLES),
    )


@router.get("/mine", response_model=CompanyOut)
def get_my_company(session: SessionDep, user: CurrentUser) -> CompanyOut:
    if user.role != UserRole.MSME:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="only MSME users have an owned company profile",
        )
    company = session.exec(select(Company).where(Company.owner_user_id == user.id)).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="no company profile linked to your account",
        )
    return _to_out(company, session)


@router.get("", response_model=CompanyListResponse)
def list_companies(
    session: SessionDep,
    _user: User = Depends(require_roles(UserRole.SUPER, UserRole.ADMIN)),
    q: str | None = Query(default=None, description="search by name, GST, CIN, Udyam"),
    sector: str | None = Query(default=None, description="sector code"),
    district: str | None = Query(default=None, description="district code"),
    pincode: str | None = Query(default=None, description="pincode"),
    turnover: str | None = Query(default=None, description="turnover range code"),
    tag: str | None = Query(default=None, description="filter by tag value"),
    limit: int = Query(default=25, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> CompanyListResponse:
    stmt = select(Company)
    if q:
        like = f"%{q.lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Company.name).like(like),
                func.lower(Company.gst_number).like(like),
                func.lower(Company.cin).like(like),
                func.lower(Company.udyam_number).like(like),
            )
        )
    if sector:
        stmt = stmt.where(Company.sector_code == sector)
    if district:
        stmt = stmt.where(Company.district_code == district)
    if pincode:
        stmt = stmt.where(Company.pincode == pincode)
    if turnover:
        stmt = stmt.where(Company.turnover_range_code == turnover)

    total = session.exec(select(func.count()).select_from(stmt.subquery())).one()
    rows = session.exec(stmt.order_by(Company.name).offset(offset).limit(limit)).all()

    items = [_to_list_item(r, session) for r in rows]
    if tag:
        items = [it for it in items if tag in it.tags]

    return CompanyListResponse(items=items, total=int(total), limit=limit, offset=offset)


@router.get("/export")
def export_companies(
    session: SessionDep,
    actor: User = Depends(require_roles(UserRole.SUPER, UserRole.ADMIN)),
    q: str | None = Query(default=None),
    sector: str | None = Query(default=None),
    district: str | None = Query(default=None),
    pincode: str | None = Query(default=None),
    turnover: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    ids: str | None = Query(default=None, description="comma-separated company ids"),
) -> Response:
    stmt = select(Company)
    if ids:
        id_list = [int(x) for x in ids.split(",") if x.strip().isdigit()]
        if id_list:
            stmt = stmt.where(Company.id.in_(id_list))  # type: ignore[attr-defined]
    if q:
        like = f"%{q.lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Company.name).like(like),
                func.lower(Company.gst_number).like(like),
                func.lower(Company.cin).like(like),
                func.lower(Company.udyam_number).like(like),
            )
        )
    if sector:
        stmt = stmt.where(Company.sector_code == sector)
    if district:
        stmt = stmt.where(Company.district_code == district)
    if pincode:
        stmt = stmt.where(Company.pincode == pincode)
    if turnover:
        stmt = stmt.where(Company.turnover_range_code == turnover)

    rows = session.exec(stmt.order_by(Company.name)).all()
    if tag:
        rows = [c for c in rows if tag in (c.tags or [])]

    data = companies_to_xlsx(rows, session)
    audit.record(
        session,
        actor,
        Action.REPORT_EXPORTED,
        resource_type="company",
        resource_name="company-registry",
        details={"row_count": len(rows), "format": "xlsx"},
    )
    session.commit()
    ts = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="companies-{ts}.xlsx"'},
    )


class BulkTagPayload(BaseModel):
    company_ids: list[int]
    add_tags: list[str] = []
    remove_tags: list[str] = []


@router.post("/bulk/tags", status_code=status.HTTP_204_NO_CONTENT)
def bulk_update_tags(
    payload: BulkTagPayload,
    session: SessionDep,
    actor: User = Depends(require_roles(UserRole.SUPER, UserRole.ADMIN)),
) -> None:
    for cid in payload.company_ids:
        c = session.get(Company, cid)
        if not c:
            continue
        tags = set(c.tags or [])
        tags.update(payload.add_tags)
        tags -= set(payload.remove_tags)
        c.tags = sorted(tags)
        session.add(c)
    session.commit()


@router.get("/{company_id}", response_model=CompanyOut)
def get_company(company_id: int, session: SessionDep, user: CurrentUser) -> CompanyOut:
    c = session.get(Company, company_id)
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="company not found")
    if user.role == UserRole.MSME and c.owner_user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="MSME users can only view their own company profile",
        )
    return _to_out(c, session)


@router.post(
    "",
    response_model=CompanyOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(UserRole.SUPER, UserRole.ADMIN))],
)
def create_company(payload: CompanyCreate, session: SessionDep, actor: CurrentUser) -> CompanyOut:
    if payload.gst_number:
        existing = session.exec(select(Company).where(Company.gst_number == payload.gst_number)).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"company with GST {payload.gst_number} already exists",
            )
    c = Company(**payload.model_dump())
    session.add(c)
    session.flush()
    audit.record(
        session,
        actor,
        Action.COMPANY_CREATED,
        resource_type="company",
        resource_id=c.id,
        resource_name=c.name,
        details={"sector": c.sector_code, "district": c.district_code},
    )
    session.commit()
    session.refresh(c)
    return _to_out(c, session)


@router.patch("/{company_id}", response_model=CompanyOut)
def update_company(
    company_id: int,
    payload: CompanyUpdate,
    session: SessionDep,
    user: CurrentUser,
) -> CompanyOut:
    c = session.get(Company, company_id)
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="company not found")

    data = payload.model_dump(exclude_unset=True)

    # MSME users cannot touch govt-verified fields.
    if user.role == UserRole.MSME:
        # MSME can only edit their own company
        if c.owner_user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="MSME users can only edit their own company profile",
            )
        forbidden = LOCKED_FIELDS_FOR_MSME & data.keys()
        if forbidden:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"fields locked for MSME role: {sorted(forbidden)}",
            )

    # Tag edits are TIDCO-only.
    if "tags" in data and user.role.value not in TAG_EDIT_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="only TIDCO officials (super/admin) can edit tags",
        )

    # Unique-GST check on rename.
    if "gst_number" in data and data["gst_number"] and data["gst_number"] != c.gst_number:
        clash = session.exec(select(Company).where(Company.gst_number == data["gst_number"])).first()
        if clash:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"company with GST {data['gst_number']} already exists",
            )

    tags_before: list[str] = list(c.tags or [])
    changed: list[str] = []
    for field, value in data.items():
        if getattr(c, field) != value:
            setattr(c, field, value)
            changed.append(field)
    c.updated_at = datetime.now(timezone.utc)

    # Separate audit entry for tag changes (per spec — tags are a distinct event)
    if "tags" in changed:
        audit.record(
            session,
            user,
            Action.COMPANY_TAGGED,
            resource_type="company",
            resource_id=c.id,
            resource_name=c.name,
            details={
                "tags_before": tags_before,
                "tags_after": list(c.tags or []),
            },
        )
        changed.remove("tags")

    if changed:
        audit.record(
            session,
            user,
            Action.COMPANY_UPDATED,
            resource_type="company",
            resource_id=c.id,
            resource_name=c.name,
            details={"fields_changed": changed},
        )

    session.add(c)
    session.commit()
    session.refresh(c)
    return _to_out(c, session)


@router.delete(
    "/{company_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(UserRole.SUPER))],
)
def delete_company(company_id: int, session: SessionDep, actor: CurrentUser) -> None:
    c = session.get(Company, company_id)
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="company not found")
    audit.record(
        session,
        actor,
        Action.COMPANY_DELETED,
        resource_type="company",
        resource_id=c.id,
        resource_name=c.name,
    )
    session.delete(c)
    session.commit()
