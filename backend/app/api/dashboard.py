from collections import Counter

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import select

from app.core.geo_lookup import (
    build_pincode_maps,
    effective_taluk_code,
)
from app.deps import SessionDep, require_roles
from app.models.user import UserRole
from app.models.company import Company
from app.models.master import DistrictMaster, TalukMaster
from app.schemas.dashboard import (
    DistrictsOverview,
    PincodeCount,
    RegionCount,
    TalukDrilldown,
    TalukPincodeDrilldown,
)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def _matching_companies(
    session,
    sector: str | None,
    turnover: str | None,
    tag: str | None,
    district: str | None = None,
    taluk: str | None = None,
) -> list[Company]:
    stmt = select(Company)
    if sector:
        stmt = stmt.where(Company.sector_code == sector)
    if turnover:
        stmt = stmt.where(Company.turnover_range_code == turnover)
    if district:
        stmt = stmt.where(Company.district_code == district)
    if taluk:
        stmt = stmt.where(Company.taluk_code == taluk)
    rows = session.exec(stmt).all()
    if tag:
        rows = [c for c in rows if tag in (c.tags or [])]
    return rows


@router.get("/districts", response_model=DistrictsOverview)
def districts_overview(
    session: SessionDep,
    _user=Depends(require_roles(UserRole.ADMIN)),
    sector: str | None = Query(default=None),
    turnover: str | None = Query(default=None),
    tag: str | None = Query(default=None),
) -> DistrictsOverview:
    districts = session.exec(select(DistrictMaster).order_by(DistrictMaster.name)).all()
    matched = _matching_companies(session, sector, turnover, tag)

    by_district: Counter[str] = Counter()
    for c in matched:
        if c.district_code:
            by_district[c.district_code] += 1

    items = [
        RegionCount(code=d.code, name=d.name, company_count=by_district.get(d.code, 0))
        for d in districts
    ]
    return DistrictsOverview(
        total_companies=len(matched),
        total_districts_with_msmes=sum(1 for it in items if it.company_count > 0),
        items=items,
    )


@router.get("/districts/{district_code}/taluks", response_model=TalukDrilldown)
def district_taluks(
    district_code: str,
    session: SessionDep,
    _user=Depends(require_roles(UserRole.ADMIN)),
    sector: str | None = Query(default=None),
    turnover: str | None = Query(default=None),
    tag: str | None = Query(default=None),
) -> TalukDrilldown:
    district = session.exec(
        select(DistrictMaster).where(DistrictMaster.code == district_code)
    ).first()
    if not district:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="unknown district")

    taluks = session.exec(
        select(TalukMaster)
        .where(TalukMaster.district_code == district_code)
        .where(TalukMaster.is_active == True)  # noqa: E712
        .order_by(TalukMaster.name)
    ).all()
    matched = _matching_companies(session, sector, turnover, tag, district=district_code)
    pincode_map, pincode_district_map = build_pincode_maps(session)

    by_taluk: Counter[str] = Counter()
    for c in matched:
        taluk = effective_taluk_code(c, pincode_map, pincode_district_map)
        if taluk:
            by_taluk[taluk] += 1

    items = [
        RegionCount(code=t.code, name=t.name, company_count=by_taluk.get(t.code, 0))
        for t in taluks
    ]

    return TalukDrilldown(
        district_code=district.code,
        district_name=district.name,
        total_companies=len(matched),
        items=sorted(items, key=lambda x: (-x.company_count, x.name)),
    )


@router.get(
    "/districts/{district_code}/taluks/{taluk_code}/pincodes",
    response_model=TalukPincodeDrilldown,
)
def taluk_pincodes(
    district_code: str,
    taluk_code: str,
    session: SessionDep,
    _user=Depends(require_roles(UserRole.ADMIN)),
    sector: str | None = Query(default=None),
    turnover: str | None = Query(default=None),
    tag: str | None = Query(default=None),
) -> TalukPincodeDrilldown:
    district = session.exec(
        select(DistrictMaster).where(DistrictMaster.code == district_code)
    ).first()
    if not district:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="unknown district")

    taluk = session.exec(
        select(TalukMaster).where(
            TalukMaster.code == taluk_code,
            TalukMaster.district_code == district_code,
        )
    ).first()
    if not taluk:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="unknown taluk")

    pincode_map, pincode_district_map = build_pincode_maps(session)
    matched = _matching_companies(session, sector, turnover, tag, district=district_code)
    matched = [
        c
        for c in matched
        if effective_taluk_code(c, pincode_map, pincode_district_map) == taluk_code
    ]

    by_pincode: Counter[str] = Counter()
    for c in matched:
        if c.pincode:
            by_pincode[c.pincode] += 1

    items = [
        PincodeCount(pincode=pc, company_count=count)
        for pc, count in sorted(by_pincode.items())
    ]
    return TalukPincodeDrilldown(
        district_code=district.code,
        district_name=district.name,
        taluk_code=taluk_code,
        taluk_name=taluk.name,
        total_companies=len(matched),
        items=items,
    )
