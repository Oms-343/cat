from sqlmodel import SQLModel, Session, create_engine
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


def migrate_db() -> None:
    """Lightweight SQLite migrations for dev databases created before new columns."""
    _sqlite_add_column_if_missing("companies", "taluk_code", "VARCHAR")
    _sqlite_add_column_if_missing("master_pincodes", "district_code", "VARCHAR")
    _sqlite_add_column_if_missing("master_pincodes", "taluk_code", "VARCHAR")


def init_db() -> None:
    from app.models import user as _user  # noqa: F401 — register models
    from app.models import master as _master  # noqa: F401
    from app.models import company as _company  # noqa: F401
    from app.models import audit as _audit  # noqa: F401
    from app.models import report as _report  # noqa: F401
    from app.models import company_subitem as _company_subitem  # noqa: F401
    from app.models import edit_request as _edit_request  # noqa: F401
    SQLModel.metadata.create_all(engine)
    migrate_db()


def get_session():
    with Session(engine) as session:
        yield session
