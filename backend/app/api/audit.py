import csv
import io
import json
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlmodel import desc, func, select
from app.deps import SessionDep, require_roles
from app.models.audit import AuditLog
from app.models.user import UserRole
from app.schemas.audit import AuditLogList, AuditLogOut

router = APIRouter(
    prefix="/api/audit-log",
    tags=["audit"],
    dependencies=[Depends(require_roles(UserRole.SUPER, UserRole.ADMIN))],
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
) -> StreamingResponse:
    stmt = _build_query(action, resource_type, user_email, since, until).order_by(
        desc(AuditLog.timestamp)
    )
    rows = session.exec(stmt).all()

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(
        [
            "timestamp",
            "action",
            "resource_type",
            "resource_id",
            "resource_name",
            "user_email",
            "user_name",
            "user_role",
            "details_json",
        ]
    )
    for r in rows:
        writer.writerow(
            [
                r.timestamp.isoformat(),
                r.action,
                r.resource_type or "",
                r.resource_id if r.resource_id is not None else "",
                r.resource_name or "",
                r.user_email or "",
                r.user_name or "",
                r.user_role or "",
                json.dumps(r.details, separators=(",", ":")) if r.details else "",
            ]
        )
    buf.seek(0)

    filename = f"audit-log-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}.csv"
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
