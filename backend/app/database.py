from sqlmodel import SQLModel, Session, create_engine, select
from app.config import get_settings

settings = get_settings()

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, echo=False, connect_args=connect_args)


def _sqlite_add_column_if_missing(table: str, column: str, col_type: str) -> None:
    if not settings.database_url.startswith("sqlite"):
        return
    import sqlalchemy as sa

    with engine.connect() as conn:
        rows = conn.execute(sa.text(f"PRAGMA table_info({table})")).fetchall()
        names = {r[1] for r in rows}
        if column not in names:
            conn.execute(sa.text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))
            conn.commit()


def _sync_district_master() -> None:
    """Insert districts from master_seed that are not yet in the DB."""
    from app.data.master_seed import DISTRICTS
    from app.models.master import DistrictMaster

    with Session(engine) as session:
        for idx, (code, name, description) in enumerate(DISTRICTS):
            existing = session.exec(select(DistrictMaster).where(DistrictMaster.code == code)).first()
            if existing:
                continue
            session.add(
                DistrictMaster(
                    code=code,
                    name=name,
                    description=description,
                    is_active=True,
                    sort_order=idx,
                )
            )
        session.commit()


def _remove_retired_districts() -> None:
    """Drop duplicate district rows removed from master_seed (e.g. CHG → use CGL)."""
    from app.models.master import DistrictMaster

    with Session(engine) as session:
        for code in ("CHG",):
            row = session.exec(select(DistrictMaster).where(DistrictMaster.code == code)).first()
            if row:
                session.delete(row)
        session.commit()


def migrate_db() -> None:
    """Lightweight SQLite migrations for dev databases created before new columns."""
    _sqlite_add_column_if_missing("companies", "taluk_code", "VARCHAR")
    _sqlite_add_column_if_missing("master_pincodes", "district_code", "VARCHAR")
    _sqlite_add_column_if_missing("master_pincodes", "taluk_code", "VARCHAR")
    _sqlite_add_column_if_missing("onboarding_campaign_messages", "responded_at", "DATETIME")
    _sqlite_add_column_if_missing("onboarding_campaign_messages", "updated_at", "DATETIME")
    _sqlite_add_column_if_missing("onboarding_campaign_messages", "recipient_name", "VARCHAR")
    _sqlite_add_column_if_missing("onboarding_campaign_messages", "outreach_contact_id", "INTEGER")
    _sqlite_add_column_if_missing("onboarding_campaigns", "language_code", "VARCHAR")
    _sqlite_add_column_if_missing("onboarding_campaign_messages", "enrollment_invite_id", "INTEGER")
    _sqlite_add_column_if_missing("enrollment_invites", "tab1_submitted_at", "DATETIME")
    _sqlite_add_column_if_missing("outreach_contacts", "converted_company_id", "INTEGER")
    _remove_retired_districts()
    _sync_district_master()
    _sync_geo_masters()


def _sync_geo_masters() -> None:
    """Keep taluk master and company taluk assignments in sync with pincode map."""
    from sqlmodel import Session

    from app.core.geo_lookup import backfill_company_taluks, sync_taluk_master
    from app.data.taluk_pincode_seed import PINCODES
    from app.models.master import PincodeMaster

    with Session(engine) as session:
        sync_taluk_master(session)
        for idx, (code, name, district_code, taluk_code) in enumerate(PINCODES):
            existing = session.exec(select(PincodeMaster).where(PincodeMaster.code == code)).first()
            if existing:
                changed = False
                if not existing.taluk_code and taluk_code:
                    existing.taluk_code = taluk_code
                    changed = True
                if not existing.district_code and district_code:
                    existing.district_code = district_code
                    changed = True
                if changed:
                    session.add(existing)
                continue
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
        session.commit()
        backfill_company_taluks(session)


def init_db() -> None:
    from app.models import user as _user  # noqa: F401 — register models
    from app.models import master as _master  # noqa: F401
    from app.models import company as _company  # noqa: F401
    from app.models import audit as _audit  # noqa: F401
    from app.models import report as _report  # noqa: F401
    from app.models import company_subitem as _company_subitem  # noqa: F401
    from app.models import edit_request as _edit_request  # noqa: F401
    from app.models import onboarding_campaign as _onboarding_campaign  # noqa: F401
    from app.models import outreach_contact as _outreach_contact  # noqa: F401
    from app.models import enrollment_invite as _enrollment_invite  # noqa: F401
    SQLModel.metadata.create_all(engine)
    migrate_db()


def get_session():
    with Session(engine) as session:
        yield session
