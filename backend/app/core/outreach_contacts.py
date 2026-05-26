"""Import and query outreach (unregistered) contacts."""
import csv
import io
from collections.abc import Iterable
from datetime import datetime, timezone
from typing import Any

from openpyxl import load_workbook
from sqlmodel import Session, func, select

from app.core.phone import normalize_phone
from app.models.outreach_contact import OutreachContact


def _cell_str(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, float) and value == int(value):
        return str(int(value))
    return str(value).strip()


def _normalize_row(row: dict[str, Any]) -> dict[str, str]:
    return {
        str(k).strip().lower().replace(" ", "_"): _cell_str(v)
        for k, v in row.items()
        if k is not None and str(k).strip()
    }


def count_active_contacts(session: Session) -> int:
    return int(
        session.exec(
            select(func.count())
            .select_from(OutreachContact)
            .where(OutreachContact.is_active == True)  # noqa: E712
        ).one()
    )


def import_contacts_rows(session: Session, rows: Iterable[dict[str, Any]]) -> dict[str, Any]:
    created = 0
    updated = 0
    skipped = 0
    contact_ids: list[int] = []
    now = datetime.now(timezone.utc)

    for raw in rows:
        row = _normalize_row(raw)
        name = row.get("name") or row.get("business_name") or ""
        phone_raw = row.get("phone") or row.get("mobile") or row.get("contact_phone") or ""
        phone = normalize_phone(phone_raw)
        if not name or not phone:
            skipped += 1
            continue

        district_code = row.get("district_code") or row.get("district") or None
        sector_code = row.get("sector_code") or row.get("sector") or None
        email = row.get("email") or None
        district_code = district_code or None
        sector_code = sector_code or None
        email = email or None

        existing = session.exec(
            select(OutreachContact).where(OutreachContact.phone == phone)
        ).first()
        if existing:
            existing.name = name
            existing.district_code = district_code
            existing.sector_code = sector_code
            existing.email = email
            existing.is_active = True
            existing.updated_at = now
            session.add(existing)
            session.flush()
            contact_ids.append(existing.id)  # type: ignore[arg-type]
            updated += 1
        else:
            contact = OutreachContact(
                name=name,
                phone=phone,
                email=email,
                district_code=district_code,
                sector_code=sector_code,
                source="csv_import",
            )
            session.add(contact)
            session.flush()
            contact_ids.append(contact.id)  # type: ignore[arg-type]
            created += 1

    session.commit()
    return {
        "created": created,
        "updated": updated,
        "skipped": skipped,
        "contact_ids": contact_ids,
    }


def import_contacts_csv(session: Session, content: str) -> dict[str, Any]:
    reader = csv.DictReader(io.StringIO(content))
    return import_contacts_rows(session, reader)


def import_contacts_xlsx(session: Session, content: bytes) -> dict[str, Any]:
    wb = load_workbook(io.BytesIO(content), read_only=True, data_only=True)
    try:
        ws = wb.active
        row_iter = ws.iter_rows(values_only=True)
        try:
            header_row = next(row_iter)
        except StopIteration:
            return {"created": 0, "updated": 0, "skipped": 0, "contact_ids": []}

        headers: list[str] = []
        for cell in header_row:
            key = _cell_str(cell).lower().replace(" ", "_")
            headers.append(key)

        rows: list[dict[str, Any]] = []
        for values in row_iter:
            if not values or all(v is None or _cell_str(v) == "" for v in values):
                continue
            row: dict[str, Any] = {}
            for i, val in enumerate(values):
                if i < len(headers) and headers[i]:
                    row[headers[i]] = val
            rows.append(row)
    finally:
        wb.close()

    return import_contacts_rows(session, rows)
