"""Geographic lookups for dashboard drill-down (taluk / pincode resolution)."""

from __future__ import annotations

import json
from pathlib import Path

from sqlmodel import Session, select

from app.models.company import Company
from app.models.master import PincodeMaster, TalukMaster

_INDEX_PATH = (
    Path(__file__).resolve().parents[3]
    / "frontend"
    / "src"
    / "constants"
    / "maps"
    / "tn-taluks-index.json"
)


def load_taluk_index() -> dict:
    return json.loads(_INDEX_PATH.read_text(encoding="utf-8"))


def load_canonical_pincode_maps() -> tuple[dict[str, str], dict[str, str]]:
    """Pincode → taluk/district from taluk_pincodes.json (single taluk per pincode).

    When the seed file lists the same pincode more than once, the last row wins so
    regeneration order stays deterministic across environments.
    """
    from app.data.taluk_pincode_seed import PINCODES

    taluk_by_pin: dict[str, str] = {}
    district_by_pin: dict[str, str] = {}
    for pin, _label, district_code, taluk_code in PINCODES:
        taluk_by_pin[pin] = taluk_code
        district_by_pin[pin] = district_code
    return taluk_by_pin, district_by_pin


def sync_taluk_master(session: Session) -> int:
    """Sync TalukMaster from tn-taluks-index.json (create, update, deactivate stale)."""
    index = load_taluk_index()
    official_codes: set[str] = set()
    created = 0
    updated = 0
    sort = 0

    for district_code, district in index["districts"].items():
        for taluk in district["taluks"]:
            code = taluk["code"]
            official_codes.add(code)
            existing = session.exec(
                select(TalukMaster).where(TalukMaster.code == code)
            ).first()
            if existing:
                changed = False
                if existing.name != taluk["name"]:
                    existing.name = taluk["name"]
                    changed = True
                if existing.district_code != district_code:
                    existing.district_code = district_code
                    changed = True
                if not existing.is_active:
                    existing.is_active = True
                    changed = True
                if existing.sort_order != sort:
                    existing.sort_order = sort
                    changed = True
                if changed:
                    session.add(existing)
                    updated += 1
            else:
                session.add(
                    TalukMaster(
                        code=code,
                        name=taluk["name"],
                        district_code=district_code,
                        is_active=True,
                        sort_order=sort,
                    )
                )
                created += 1
            sort += 1

    stale = session.exec(
        select(TalukMaster).where(TalukMaster.is_active == True)  # noqa: E712
    ).all()
    deactivated = 0
    for row in stale:
        if row.code in official_codes:
            continue
        row.is_active = False
        session.add(row)
        deactivated += 1

    if created or updated or deactivated:
        session.commit()
    return created


def sync_pincode_master(session: Session) -> tuple[int, int]:
    """Upsert PincodeMaster from canonical seed data (one row per pincode)."""
    from app.data.taluk_pincode_seed import PINCODES

    created = 0
    updated = 0
    seen: set[str] = set()
    for idx, (code, name, district_code, taluk_code) in enumerate(PINCODES):
        if code in seen:
            continue
        seen.add(code)
        existing = session.exec(select(PincodeMaster).where(PincodeMaster.code == code)).first()
        if existing:
            changed = False
            if existing.name != name:
                existing.name = name
                changed = True
            if existing.district_code != district_code:
                existing.district_code = district_code
                changed = True
            if existing.taluk_code != taluk_code:
                existing.taluk_code = taluk_code
                changed = True
            if existing.sort_order != idx:
                existing.sort_order = idx
                changed = True
            if changed:
                session.add(existing)
                updated += 1
        else:
            session.add(
                PincodeMaster(
                    code=code,
                    name=name,
                    district_code=district_code,
                    taluk_code=taluk_code,
                    is_active=True,
                    sort_order=idx,
                )
            )
            created += 1
    if created or updated:
        session.commit()
    return created, updated


def build_pincode_maps(session: Session) -> tuple[dict[str, str], dict[str, str]]:
    """Canonical seed maps merged with DB (canonical wins on conflict)."""
    taluk_by_pin, district_by_pin = load_canonical_pincode_maps()
    rows = session.exec(select(PincodeMaster)).all()
    for row in rows:
        if row.code not in taluk_by_pin and row.taluk_code:
            taluk_by_pin[row.code] = row.taluk_code
        if row.code not in district_by_pin and row.district_code:
            district_by_pin[row.code] = row.district_code
    return taluk_by_pin, district_by_pin


def effective_taluk_code(
    company: Company,
    pincode_map: dict[str, str],
    pincode_district_map: dict[str, str],
) -> str | None:
    """Resolve taluk for dashboard counts.

  Pincode master is authoritative when the company's pincode maps and the
  district matches. Stored company.taluk_code is only used as a fallback.
    """
    if company.pincode and company.pincode in pincode_map:
        pin_district = pincode_district_map.get(company.pincode)
        if (
            not company.district_code
            or not pin_district
            or pin_district == company.district_code
        ):
            return pincode_map[company.pincode]
    if company.taluk_code:
        return company.taluk_code
    return None


def reconcile_company_taluks(session: Session) -> int:
    """Align every company's taluk_code with the canonical pincode map."""
    pincode_map, pincode_district_map = build_pincode_maps(session)
    if not pincode_map:
        return 0
    rows = session.exec(select(Company)).all()
    updated = 0
    for company in rows:
        resolved = effective_taluk_code(company, pincode_map, pincode_district_map)
        if resolved == company.taluk_code:
            continue
        company.taluk_code = resolved
        session.add(company)
        updated += 1
    if updated:
        session.commit()
    return updated


def backfill_company_taluks(session: Session) -> int:
    """Backfill taluk_code on companies missing it (alias for reconcile)."""
    return reconcile_company_taluks(session)
