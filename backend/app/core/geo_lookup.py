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


def build_pincode_maps(session: Session) -> tuple[dict[str, str], dict[str, str]]:
    rows = session.exec(select(PincodeMaster)).all()
    taluk_by_pin = {p.code: p.taluk_code for p in rows if p.taluk_code}
    district_by_pin = {p.code: p.district_code for p in rows if p.district_code}
    return taluk_by_pin, district_by_pin


def effective_taluk_code(
    company: Company,
    pincode_map: dict[str, str],
    pincode_district_map: dict[str, str],
) -> str | None:
    if company.taluk_code:
        return company.taluk_code
    if not company.pincode:
        return None
    taluk = pincode_map.get(company.pincode)
    if not taluk:
        return None
    pin_district = pincode_district_map.get(company.pincode)
    if company.district_code and pin_district and pin_district != company.district_code:
        return None
    return taluk


def backfill_company_taluks(session: Session) -> int:
    """Set taluk_code on companies that have a pincode mapped in PincodeMaster."""
    pincode_map, pincode_district_map = build_pincode_maps(session)
    if not pincode_map:
        return 0
    rows = session.exec(select(Company).where(Company.taluk_code.is_(None))).all()
    updated = 0
    for company in rows:
        taluk = effective_taluk_code(company, pincode_map, pincode_district_map)
        if not taluk:
            continue
        company.taluk_code = taluk
        session.add(company)
        updated += 1
    if updated:
        session.commit()
    return updated
