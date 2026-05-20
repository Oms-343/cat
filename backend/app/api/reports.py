from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlmodel import desc, func, select

from app.core import audit
from app.core.exports import to_csv, to_xlsx
from app.core.reports import REPORT_REGISTRY, ReportResult
from app.deps import CurrentUser, SessionDep, require_roles
from app.models.audit import Action
from app.models.report import ReportRun
from app.models.user import UserRole
from app.schemas.report import (
    ReportColumn,
    ReportFilterSpec,
    ReportHistoryList,
    ReportMeta,
    ReportRunOut,
    ReportRunResult,
)

router = APIRouter(
    prefix="/api/reports",
    tags=["reports"],
    dependencies=[Depends(require_roles(UserRole.SUPER, UserRole.ADMIN))],
)


def _get_report(slug: str):
    rd = REPORT_REGISTRY.get(slug)
    if not rd:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"unknown report '{slug}'. Valid: {sorted(REPORT_REGISTRY)}",
        )
    return rd


def _validate_filters(rd, filters: dict[str, Any]) -> dict[str, Any]:
    """Drop blank values and check required filters."""
    cleaned = {k: v for k, v in filters.items() if v not in (None, "")}
    for f in rd.filters:
        if f.required and not cleaned.get(f.key):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"filter '{f.key}' is required for {rd.slug}",
            )
    return cleaned


def _result_to_response(rd, result: ReportResult, filters: dict[str, Any]) -> ReportRunResult:
    return ReportRunResult(
        slug=rd.slug,
        name=rd.name,
        filters_applied=filters,
        columns=[ReportColumn(**c) for c in result.columns],
        rows=result.rows,
        summary=result.summary,
        sheets={
            name: {
                "columns": sub.columns,
                "rows": sub.rows,
                "summary": sub.summary,
            }
            for name, sub in result.sheets.items()
        },
        generated_at=datetime.now(timezone.utc),
    )


@router.get("", response_model=list[ReportMeta])
def list_reports() -> list[ReportMeta]:
    return [
        ReportMeta(
            slug=rd.slug,
            name=rd.name,
            description=rd.description,
            icon=rd.icon,
            filters=[ReportFilterSpec(**f.__dict__) for f in rd.filters],
        )
        for rd in REPORT_REGISTRY.values()
    ]


@router.post("/{slug}/run", response_model=ReportRunResult)
def run_report(
    slug: str,
    filters: dict[str, Any],
    session: SessionDep,
    _user: CurrentUser,
) -> ReportRunResult:
    rd = _get_report(slug)
    cleaned = _validate_filters(rd, filters)
    result = rd.runner(session, cleaned)
    return _result_to_response(rd, result, cleaned)


@router.get("/history", response_model=ReportHistoryList)
def list_history(
    session: SessionDep,
    _user: CurrentUser,
    limit: int = Query(default=50, ge=1, le=500),
) -> ReportHistoryList:
    total = session.exec(select(func.count()).select_from(ReportRun)).one()
    rows = session.exec(
        select(ReportRun).order_by(desc(ReportRun.timestamp)).limit(limit)
    ).all()
    return ReportHistoryList(
        items=[ReportRunOut.model_validate(r) for r in rows],
        total=int(total),
    )


def _export_file(
    rd, result: ReportResult, filters: dict[str, Any], fmt: str, session, actor
):
    if fmt not in ("xlsx", "csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="format must be 'xlsx' or 'csv'",
        )

    if fmt == "xlsx":
        content = to_xlsx(result, rd.name)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    else:
        content = to_csv(result)
        media_type = "text/csv"

    run = ReportRun(
        report_slug=rd.slug,
        report_name=rd.name,
        format=fmt,
        row_count=len(result.rows),
        filters=filters,
        user_id=actor.id,
        user_email=actor.email,
        user_role=actor.role.value,
        user_name=actor.full_name,
    )
    session.add(run)
    audit.record(
        session,
        actor,
        Action.REPORT_EXPORTED,
        resource_type="report",
        resource_name=rd.name,
        details={"slug": rd.slug, "format": fmt, "row_count": len(result.rows), "filters": filters},
    )
    session.commit()

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    filename = f"{rd.slug}-{timestamp}.{fmt}"

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/{slug}/export")
def export_report(
    slug: str,
    filters: dict[str, Any],
    session: SessionDep,
    actor: CurrentUser,
    format: str = Query(default="xlsx", description="xlsx or csv"),
):
    rd = _get_report(slug)
    cleaned = _validate_filters(rd, filters)
    result = rd.runner(session, cleaned)
    return _export_file(rd, result, cleaned, format, session, actor)


@router.get("/history/{run_id}/download")
def download_history(
    run_id: int,
    session: SessionDep,
    actor: CurrentUser,
):
    run = session.get(ReportRun, run_id)
    if not run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="report run not found")
    rd = _get_report(run.report_slug)
    cleaned = _validate_filters(rd, dict(run.filters))
    result = rd.runner(session, cleaned)
    return _export_file(rd, result, cleaned, run.format, session, actor)
