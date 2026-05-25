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
    """Upsert all revenue taluks from tn-taluks-index.json into TalukMaster."""
    index = load_taluk_index()
    created = 0
    sort = 0
    for district_code, district in index["districts"].items():
        for taluk in district["taluks"]:
            existing = session.exec(
                select(TalukMaster).where(TalukMaster.code == taluk["code"])
            ).first()
            if existing:
                continue
            session.add(
                TalukMaster(
                    code=taluk["code"],
                    name=taluk["name"],
                    district_code=district_code,
                    is_active=True,
                    sort_order=sort,
                )
            )
            created += 1
            sort += 1
    if created:
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
