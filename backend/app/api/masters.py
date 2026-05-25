import csv
import io
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
from sqlmodel import func, or_, select
from app.core import audit
from app.deps import CurrentUser, SessionDep, require_roles
from app.models.audit import Action
from app.models.master import MASTERS
from app.models.user import UserRole
from app.schemas.master import MasterCreate, MasterOut, MasterSummary, MasterUpdate

router = APIRouter(prefix="/api/masters", tags=["masters"])


def _get_model(key: str):
    config = MASTERS.get(key)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"unknown master '{key}'. Valid keys: {sorted(MASTERS)}",
        )
    return config["model"]


@router.get("", response_model=list[MasterSummary])
def list_masters(session: SessionDep, _user: CurrentUser) -> list[MasterSummary]:
    summaries: list[MasterSummary] = []
    for key, cfg in MASTERS.items():
        model = cfg["model"]
        total = session.exec(select(func.count()).select_from(model)).one()
        active = session.exec(
            select(func.count()).select_from(model).where(model.is_active == True)  # noqa: E712
        ).one()
        summaries.append(
            MasterSummary(
                key=key,
                label=cfg["label"],
                description=cfg["description"],
                count=int(total),
                active_count=int(active),
            )
        )
    return summaries


@router.get("/{key}", response_model=list[MasterOut])
def list_entries(
    key: str,
    session: SessionDep,
    _user: CurrentUser,
    q: str | None = Query(default=None, description="search in code or name"),
    active: bool | None = Query(default=None),
    limit: int = Query(default=500, ge=1, le=5000),
    offset: int = Query(default=0, ge=0),
) -> list[MasterOut]:
    model = _get_model(key)
    stmt = select(model)
    if q:
        like = f"%{q.lower()}%"
        stmt = stmt.where(or_(func.lower(model.code).like(like), func.lower(model.name).like(like)))
    if active is not None:
        stmt = stmt.where(model.is_active == active)
    stmt = stmt.order_by(model.sort_order, model.name).offset(offset).limit(limit)
    rows = session.exec(stmt).all()
    return [MasterOut.model_validate(r) for r in rows]


@router.post(
    "/{key}",
    response_model=MasterOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def create_entry(
    key: str, payload: MasterCreate, session: SessionDep, actor: CurrentUser
) -> MasterOut:
    model = _get_model(key)
    existing = session.exec(select(model).where(model.code == payload.code)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"entry with code '{payload.code}' already exists in {key}",
        )
    data = payload.model_dump()
    allowed = set(model.model_fields.keys())
    row = model(**{k: v for k, v in data.items() if k in allowed and v is not None})
    session.add(row)
    session.flush()
    audit.record(
        session,
        actor,
        Action.MASTER_ENTRY_CREATED,
        resource_type="master",
        resource_id=row.id,
        resource_name=f"{MASTERS[key]['label']} · {row.name}",
        details={"master_key": key, "code": row.code},
    )
    session.commit()
    session.refresh(row)
    return MasterOut.model_validate(row)


@router.patch(
    "/{key}/{entry_id}",
    response_model=MasterOut,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def update_entry(
    key: str,
    entry_id: int,
    payload: MasterUpdate,
    session: SessionDep,
    actor: CurrentUser,
) -> MasterOut:
    model = _get_model(key)
    row = session.get(model, entry_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="entry not found")

    data = payload.model_dump(exclude_unset=True)
    if "code" in data and data["code"] != row.code:
        clash = session.exec(select(model).where(model.code == data["code"])).first()
        if clash:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"entry with code '{data['code']}' already exists in {key}",
            )

    changed: list[str] = []
    for field, value in data.items():
        if getattr(row, field) != value:
            setattr(row, field, value)
            changed.append(field)
    row.updated_at = datetime.now(timezone.utc)

    if changed:
        audit.record(
            session,
            actor,
            Action.MASTER_ENTRY_UPDATED,
            resource_type="master",
            resource_id=row.id,
            resource_name=f"{MASTERS[key]['label']} · {row.name}",
            details={"master_key": key, "fields_changed": changed},
        )

    session.add(row)
    session.commit()
    session.refresh(row)
    return MasterOut.model_validate(row)


@router.delete(
    "/{key}/{entry_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def delete_entry(
    key: str, entry_id: int, session: SessionDep, actor: CurrentUser
) -> None:
    model = _get_model(key)
    row = session.get(model, entry_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="entry not found")
    audit.record(
        session,
        actor,
        Action.MASTER_ENTRY_DELETED,
        resource_type="master",
        resource_id=row.id,
        resource_name=f"{MASTERS[key]['label']} · {row.name}",
        details={"master_key": key, "code": row.code},
    )
    session.delete(row)
    session.commit()


@router.get(
    "/{key}/export",
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def export_master(key: str, session: SessionDep, _actor: CurrentUser) -> Response:
    model = _get_model(key)
    rows = session.exec(select(model).order_by(model.sort_order, model.name)).all()
    buf = io.StringIO()
    writer = csv.writer(buf)
    fieldnames = list(model.model_fields.keys())
    writer.writerow(fieldnames)
    for r in rows:
        writer.writerow([getattr(r, f) for f in fieldnames])
    data = buf.getvalue().encode("utf-8-sig")
    return Response(
        content=data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{key}-master.csv"'},
    )


@router.post(
    "/{key}/import",
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
async def import_master(
    key: str,
    session: SessionDep,
    actor: CurrentUser,
    file: UploadFile = File(...),
) -> dict[str, int]:
    model = _get_model(key)
    content = (await file.read()).decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(content))
    created = 0
    updated = 0
    allowed = set(model.model_fields.keys()) - {"id", "created_at", "updated_at"}

    for row in reader:
        code = (row.get("code") or "").strip()
        if not code:
            continue
        existing = session.exec(select(model).where(model.code == code)).first()
        payload = {k: row[k] for k in row if k in allowed and row[k] != ""}
        if "is_active" in payload:
            payload["is_active"] = str(payload["is_active"]).lower() in ("1", "true", "yes")
        if "sort_order" in payload and payload["sort_order"]:
            payload["sort_order"] = int(payload["sort_order"])

        if existing:
            for f, v in payload.items():
                setattr(existing, f, v)
            existing.updated_at = datetime.now(timezone.utc)
            session.add(existing)
            updated += 1
        else:
            if "name" not in payload:
                payload["name"] = code
            session.add(model(**payload))
            created += 1

    audit.record(
        session,
        actor,
        Action.MASTER_ENTRY_CREATED,
        resource_type="master",
        resource_name=f"{MASTERS[key]['label']} bulk import",
        details={"master_key": key, "created": created, "updated": updated},
    )
    session.commit()
    return {"created": created, "updated": updated}
