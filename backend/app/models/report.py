from datetime import datetime, timezone
from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class ReportRun(SQLModel, table=True):
    __tablename__ = "report_runs"

    id: int | None = Field(default=None, primary_key=True)
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        index=True,
    )

    report_slug: str = Field(index=True, max_length=64)
    report_name: str = Field(max_length=200)
    format: str = Field(default="xlsx", max_length=16)  # xlsx | csv
    row_count: int = Field(default=0)

    # Filter values applied at run time
    filters: dict = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))

    # Actor (denormalized)
    user_id: int | None = Field(default=None, foreign_key="users.id", index=True)
    user_email: str | None = Field(default=None, index=True)
    user_role: str | None = None
    user_name: str | None = None
