"""MIS report runners.

Each report is a pure function: `(session, filters) -> ReportResult`.
The registry below tells the API layer what filters and columns each report exposes,
which the frontend uses to build a generic UI.
"""
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Callable

from sqlmodel import Session, select

from app.core.company_completion import profile_completion_pct, section_completion
from app.models.company import Company
from app.models.master import DistrictMaster, SectorMaster, TurnoverRangeMaster


@dataclass
class ReportResult:
    columns: list[dict[str, str]]
    rows: list[dict[str, Any]]
    summary: dict[str, Any] = field(default_factory=dict)
    sheets: dict[str, "ReportResult"] = field(default_factory=dict)
    """Optional secondary sheets (used by district profile)."""


@dataclass
class FilterSpec:
    key: str
    label: str
    type: str  # "master" | "string" | "date"
    master_key: str | None = None
    required: bool = False


@dataclass
class ReportDef:
    slug: str
    name: str
    description: str
    icon: str
    filters: list[FilterSpec]
    runner: Callable[[Session, dict[str, Any]], ReportResult]


# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------


def _filtered_companies(
    session: Session,
    *,
    district: str | None = None,
    sector: str | None = None,
    turnover: str | None = None,
) -> list[Company]:
    stmt = select(Company)
    if district:
        stmt = stmt.where(Company.district_code == district)
    if sector:
        stmt = stmt.where(Company.sector_code == sector)
    if turnover:
        stmt = stmt.where(Company.turnover_range_code == turnover)
    return list(session.exec(stmt).all())


def _lookup_name(session: Session, model, code: str | None) -> str | None:
    if not code:
        return None
    row = session.exec(select(model).where(model.code == code)).first()
    return row.name if row else code


# ----------------------------------------------------------------------------
# 1. Sector Summary
# ----------------------------------------------------------------------------


def run_sector_summary(session: Session, filters: dict[str, Any]) -> ReportResult:
    companies = _filtered_companies(
        session,
        district=filters.get("district"),
    )
    sectors = {s.code: s.name for s in session.exec(select(SectorMaster)).all()}

    grouped: dict[str | None, list[Company]] = {}
    for c in companies:
        grouped.setdefault(c.sector_code, []).append(c)

    rows: list[dict[str, Any]] = []
    for sector_code, group in grouped.items():
        turnovers = [c.exact_turnover_lakhs for c in group if c.exact_turnover_lakhs]
        district_counts = Counter(c.district_code for c in group if c.district_code)
        top_district = district_counts.most_common(1)[0][0] if district_counts else None
        rows.append(
            {
                "sector_code": sector_code or "—",
                "sector_name": sectors.get(sector_code, sector_code or "Unspecified"),
                "company_count": len(group),
                "total_turnover_lakhs": round(sum(turnovers), 2) if turnovers else 0,
                "avg_turnover_lakhs": round(sum(turnovers) / len(turnovers), 2) if turnovers else 0,
                "top_district": top_district or "—",
                "mnc_count": sum(1 for c in group if c.is_mnc),
            }
        )
    rows.sort(key=lambda r: r["company_count"], reverse=True)

    return ReportResult(
        columns=[
            {"key": "sector_name", "label": "Sector"},
            {"key": "sector_code", "label": "Code"},
            {"key": "company_count", "label": "Companies", "format": "number"},
            {"key": "total_turnover_lakhs", "label": "Total Turnover (₹ Lakhs)", "format": "decimal"},
            {"key": "avg_turnover_lakhs", "label": "Avg Turnover (₹ Lakhs)", "format": "decimal"},
            {"key": "top_district", "label": "Top District"},
            {"key": "mnc_count", "label": "MNCs", "format": "number"},
        ],
        rows=rows,
        summary={
            "total_companies": len(companies),
            "sectors_active": len(rows),
        },
    )


# ----------------------------------------------------------------------------
# 2. District Profile
# ----------------------------------------------------------------------------


def run_district_profile(session: Session, filters: dict[str, Any]) -> ReportResult:
    district_code = filters.get("district")
    if not district_code:
        raise ValueError("district filter is required for district profile report")

    district = session.exec(
        select(DistrictMaster).where(DistrictMaster.code == district_code)
    ).first()
    district_name = district.name if district else district_code

    companies = _filtered_companies(
        session,
        district=district_code,
        sector=filters.get("sector"),
    )
    sectors = {s.code: s.name for s in session.exec(select(SectorMaster)).all()}
    turnover_names = {t.code: t.name for t in session.exec(select(TurnoverRangeMaster)).all()}

    # Sector breakdown
    sector_counts = Counter(c.sector_code for c in companies)
    sector_rows = [
        {
            "sector_code": code or "—",
            "sector_name": sectors.get(code, code or "Unspecified"),
            "company_count": cnt,
        }
        for code, cnt in sector_counts.most_common()
    ]

    # Turnover bracket breakdown
    turnover_counts = Counter(c.turnover_range_code for c in companies)
    turnover_rows = [
        {
            "turnover_code": code or "—",
            "turnover_name": turnover_names.get(code, code or "Unspecified"),
            "company_count": cnt,
        }
        for code, cnt in turnover_counts.most_common()
    ]

    turnovers = [c.exact_turnover_lakhs for c in companies if c.exact_turnover_lakhs]
    workforces = [c.workforce_count for c in companies if c.workforce_count]

    return ReportResult(
        columns=[
            {"key": "sector_name", "label": "Sector"},
            {"key": "sector_code", "label": "Code"},
            {"key": "company_count", "label": "Companies", "format": "number"},
        ],
        rows=sector_rows,
        summary={
            "district_name": district_name,
            "district_code": district_code,
            "total_companies": len(companies),
            "avg_turnover_lakhs": round(sum(turnovers) / len(turnovers), 2) if turnovers else 0,
            "total_turnover_lakhs": round(sum(turnovers), 2) if turnovers else 0,
            "total_workforce": sum(workforces) if workforces else 0,
            "mnc_count": sum(1 for c in companies if c.is_mnc),
        },
        sheets={
            "By Turnover": ReportResult(
                columns=[
                    {"key": "turnover_name", "label": "Turnover Range"},
                    {"key": "turnover_code", "label": "Code"},
                    {"key": "company_count", "label": "Companies", "format": "number"},
                ],
                rows=turnover_rows,
            ),
        },
    )


# ----------------------------------------------------------------------------
# 3. Growth Trends
# ----------------------------------------------------------------------------


def run_growth_trends(session: Session, filters: dict[str, Any]) -> ReportResult:
    companies = list(session.exec(select(Company)).all())

    by_month: Counter[str] = Counter()
    completion_by_month: dict[str, list[int]] = {}
    for c in companies:
        if not c.created_at:
            continue
        key = c.created_at.strftime("%Y-%m")
        by_month[key] += 1
        completion_by_month.setdefault(key, []).append(profile_completion_pct(c, session))

    rows: list[dict[str, Any]] = []
    cumulative = 0
    for month in sorted(by_month):
        cumulative += by_month[month]
        avg_completion = (
            round(sum(completion_by_month[month]) / len(completion_by_month[month]), 1)
            if completion_by_month.get(month)
            else 0
        )
        rows.append(
            {
                "month": month,
                "new_registrations": by_month[month],
                "cumulative_total": cumulative,
                "avg_completion_pct": avg_completion,
            }
        )

    return ReportResult(
        columns=[
            {"key": "month", "label": "Month"},
            {"key": "new_registrations", "label": "New Registrations", "format": "number"},
            {"key": "cumulative_total", "label": "Cumulative Total", "format": "number"},
            {"key": "avg_completion_pct", "label": "Avg Profile Completion %", "format": "decimal"},
        ],
        rows=rows,
        summary={
            "total_companies": len(companies),
            "months_covered": len(rows),
            "current_month_new": by_month.get(datetime.now(timezone.utc).strftime("%Y-%m"), 0),
        },
    )


# ----------------------------------------------------------------------------
# 4. Profile Completion
# ----------------------------------------------------------------------------


_SECTION_LABELS = {
    "basic_details": "basic details",
    "registration": "registration",
    "products": "products",
    "certifications": "certifications",
    "customers": "customers",
    "machinery": "machinery",
}


def run_profile_completion(session: Session, filters: dict[str, Any]) -> ReportResult:
    companies = _filtered_companies(
        session,
        district=filters.get("district"),
        sector=filters.get("sector"),
    )
    sectors = {s.code: s.name for s in session.exec(select(SectorMaster)).all()}
    districts = {d.code: d.name for d in session.exec(select(DistrictMaster)).all()}

    rows: list[dict[str, Any]] = []
    bucket_counts = Counter()
    for c in companies:
        pct = profile_completion_pct(c, session)
        bucket = (
            "90–100%" if pct >= 90 else
            "70–89%" if pct >= 70 else
            "40–69%" if pct >= 40 else
            "< 40%"
        )
        bucket_counts[bucket] += 1

        missing: list[str] = []
        for section_key, complete in section_completion(c, session).items():
            if section_key == "tags":
                continue
            if not complete:
                missing.append(_SECTION_LABELS.get(section_key, section_key))

        rows.append(
            {
                "company_name": c.name,
                "district": districts.get(c.district_code, c.district_code or "—"),
                "sector": sectors.get(c.sector_code, c.sector_code or "—"),
                "completion_pct": pct,
                "missing_fields": ", ".join(missing) if missing else "—",
            }
        )
    rows.sort(key=lambda r: r["completion_pct"])

    return ReportResult(
        columns=[
            {"key": "company_name", "label": "Company"},
            {"key": "district", "label": "District"},
            {"key": "sector", "label": "Sector"},
            {"key": "completion_pct", "label": "Completion %", "format": "number"},
            {"key": "missing_fields", "label": "Missing Fields"},
        ],
        rows=rows,
        summary={
            "total_companies": len(companies),
            "fully_complete": bucket_counts.get("90–100%", 0),
            "needs_attention": bucket_counts.get("< 40%", 0) + bucket_counts.get("40–69%", 0),
            **{f"bucket_{k}": v for k, v in bucket_counts.items()},
        },
    )


# ----------------------------------------------------------------------------
# 6. Certification Report
# ----------------------------------------------------------------------------


def run_certification_report(session: Session, filters: dict[str, Any]) -> ReportResult:
    from app.models.company_subitem import CompanyCertification
    from app.models.master import CertificationMaster

    companies = _filtered_companies(
        session,
        district=filters.get("district"),
        sector=filters.get("sector"),
    )
    company_ids = {c.id for c in companies}
    certs = session.exec(select(CompanyCertification)).all()
    certs = [x for x in certs if x.company_id in company_ids]

    cert_master = {m.code: m.name for m in session.exec(select(CertificationMaster)).all()}
    sectors = {s.code: s.name for s in session.exec(select(SectorMaster)).all()}

    by_cert: Counter[str] = Counter()
    by_cert_sector: dict[str, Counter[str]] = {}
    company_lookup = {c.id: c for c in companies}

    for cert in certs:
        by_cert[cert.certification_code] += 1
        co = company_lookup.get(cert.company_id)
        if co and co.sector_code:
            by_cert_sector.setdefault(cert.certification_code, Counter())[co.sector_code] += 1

    rows: list[dict[str, Any]] = []
    for code, count in by_cert.most_common():
        sector_counts = by_cert_sector.get(code, Counter())
        top_sector_code = sector_counts.most_common(1)[0][0] if sector_counts else None
        rows.append(
            {
                "certification_code": code,
                "certification_name": cert_master.get(code, code),
                "company_count": count,
                "top_sector": sectors.get(top_sector_code, top_sector_code or "—"),
                "sectors_covered": len(sector_counts),
            }
        )

    without = sum(1 for c in companies if not any(x.company_id == c.id for x in certs))

    return ReportResult(
        columns=[
            {"key": "certification_code", "label": "Code"},
            {"key": "certification_name", "label": "Certification"},
            {"key": "company_count", "label": "Companies", "format": "number"},
            {"key": "top_sector", "label": "Top Sector"},
            {"key": "sectors_covered", "label": "Sectors", "format": "number"},
        ],
        rows=rows,
        summary={
            "total_companies": len(companies),
            "companies_without_certifications": without,
            "certification_types_in_use": len(by_cert),
        },
    )


# ----------------------------------------------------------------------------
# 7. Custom summary (group-by)
# ----------------------------------------------------------------------------


def run_custom_summary(session: Session, filters: dict[str, Any]) -> ReportResult:
    group_by = filters.get("group_by") or "sector"
    companies = _filtered_companies(
        session,
        district=filters.get("district"),
        sector=filters.get("sector"),
    )
    districts = {d.code: d.name for d in session.exec(select(DistrictMaster)).all()}
    sectors = {s.code: s.name for s in session.exec(select(SectorMaster)).all()}

    def key_for(c: Company) -> str:
        if group_by == "district":
            return districts.get(c.district_code or "", c.district_code or "—")
        if group_by == "turnover":
            return c.turnover_range_code or "—"
        return sectors.get(c.sector_code or "", c.sector_code or "—")

    counts = Counter(key_for(c) for c in companies)
    rows = [{"group": k, "company_count": v} for k, v in counts.most_common()]

    return ReportResult(
        columns=[
            {"key": "group", "label": group_by.title()},
            {"key": "company_count", "label": "Companies", "format": "number"},
        ],
        rows=rows,
        summary={"group_by": group_by, "total_companies": len(companies)},
    )


# ----------------------------------------------------------------------------
# Registry
# ----------------------------------------------------------------------------


REPORT_REGISTRY: dict[str, ReportDef] = {
    "sector-summary": ReportDef(
        slug="sector-summary",
        name="Sector-wise Summary",
        description="Companies grouped by sector with turnover stats and top district.",
        icon="📊",
        filters=[
            FilterSpec("district", "District", "master", master_key="districts"),
        ],
        runner=run_sector_summary,
    ),
    "district-profile": ReportDef(
        slug="district-profile",
        name="District Profile",
        description="Detailed snapshot of one district: top sectors and turnover spread.",
        icon="📍",
        filters=[
            FilterSpec("district", "District", "master", master_key="districts", required=True),
            FilterSpec("sector", "Sector", "master", master_key="sectors"),
        ],
        runner=run_district_profile,
    ),
    "growth-trends": ReportDef(
        slug="growth-trends",
        name="Growth Trends",
        description="New registrations and average profile completion month over month.",
        icon="📈",
        filters=[],
        runner=run_growth_trends,
    ),
    "profile-completion": ReportDef(
        slug="profile-completion",
        name="Profile Completion",
        description="Which companies have incomplete profiles and what fields are missing.",
        icon="✅",
        filters=[
            FilterSpec("district", "District", "master", master_key="districts"),
            FilterSpec("sector", "Sector", "master", master_key="sectors"),
        ],
        runner=run_profile_completion,
    ),
    "certification-report": ReportDef(
        slug="certification-report",
        name="Certification Report",
        description="How many companies hold each certification (ISO 9001, etc.) and sector coverage.",
        icon="🏆",
        filters=[
            FilterSpec("district", "District", "master", master_key="districts"),
            FilterSpec("sector", "Sector", "master", master_key="sectors"),
        ],
        runner=run_certification_report,
    ),
    "custom-summary": ReportDef(
        slug="custom-summary",
        name="Custom Summary",
        description="Group companies by sector, district, or turnover range.",
        icon="🧩",
        filters=[
            FilterSpec("group_by", "Group By (sector|district|turnover)", "string"),
            FilterSpec("district", "District", "master", master_key="districts"),
            FilterSpec("sector", "Sector", "master", master_key="sectors"),
        ],
        runner=run_custom_summary,
    ),
}
