from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlmodel import desc, func, select

from app.core.audit_export import audit_logs_to_xlsx
from app.deps import SessionDep, require_roles
from app.models.audit import AuditLog
from app.models.user import UserRole
from app.schemas.audit import AuditLogList, AuditLogOut

router = APIRouter(
    prefix="/api/audit-log",
    tags=["audit"],
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)


def _build_query(
    action: str | None,
    resource_type: str | None,
    user_email: str | None,
    since: datetime | None,
    until: datetime | None,
):
    stmt = select(AuditLog)
    if action:
        stmt = stmt.where(AuditLog.action == action)
    if resource_type:
        stmt = stmt.where(AuditLog.resource_type == resource_type)
    if user_email:
        stmt = stmt.where(AuditLog.user_email == user_email)
    if since:
        stmt = stmt.where(AuditLog.timestamp >= since)
    if until:
        stmt = stmt.where(AuditLog.timestamp <= until)
    return stmt


@router.get("", response_model=AuditLogList)
def list_audit(
    session: SessionDep,
    action: str | None = Query(default=None, description="exact action match"),
    resource_type: str | None = Query(default=None),
    user_email: str | None = Query(default=None),
    since: datetime | None = Query(default=None),
    until: datetime | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> AuditLogList:
    stmt = _build_query(action, resource_type, user_email, since, until)
    total = session.exec(select(func.count()).select_from(stmt.subquery())).one()
    rows = session.exec(
        stmt.order_by(desc(AuditLog.timestamp)).offset(offset).limit(limit)
    ).all()
    return AuditLogList(
        items=[AuditLogOut.model_validate(r) for r in rows],
        total=int(total),
        limit=limit,
        offset=offset,
    )


@router.get("/export")
def export_audit(
    session: SessionDep,
    action: str | None = Query(default=None),
    resource_type: str | None = Query(default=None),
    user_email: str | None = Query(default=None),
    since: datetime | None = Query(default=None),
    until: datetime | None = Query(default=None),
) -> Response:
    stmt = _build_query(action, resource_type, user_email, since, until).order_by(
        desc(AuditLog.timestamp)
    )
    rows = session.exec(stmt).all()
    data = audit_logs_to_xlsx(rows)

    ts = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="audit-log-{ts}.xlsx"'},
    )
