from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class EditRequestStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class CompanyEditRequest(SQLModel, table=True):
    __tablename__ = "company_edit_requests"

    id: int | None = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="companies.id", index=True)
    requested_by_user_id: int = Field(foreign_key="users.id", index=True)
    status: EditRequestStatus = Field(default=EditRequestStatus.PENDING, index=True)
    proposed_changes: dict = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    review_note: str | None = None
    reviewed_by_user_id: int | None = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reviewed_at: datetime | None = None
