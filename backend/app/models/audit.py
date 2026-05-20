from datetime import datetime, timezone
from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_logs"

    id: int | None = Field(default=None, primary_key=True)
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        index=True,
    )

    # Actor (denormalized — survives if user is deleted)
    user_id: int | None = Field(default=None, foreign_key="users.id", index=True)
    user_email: str | None = Field(default=None, index=True)
    user_role: str | None = None
    user_name: str | None = None

    # What happened
    action: str = Field(index=True, max_length=64)

    # What it was done to
    resource_type: str | None = Field(default=None, index=True, max_length=64)
    resource_id: int | None = Field(default=None, index=True)
    resource_name: str | None = Field(default=None, max_length=200)

    # Structured payload — fields_changed, before/after, etc.
    details: dict = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))


# Action constants — keep names stable for log analysis.
class Action:
    USER_LOGIN = "USER_LOGIN"
    USER_CREATED = "USER_CREATED"
    USER_UPDATED = "USER_UPDATED"
    USER_DEACTIVATED = "USER_DEACTIVATED"
    USER_PASSWORD_RESET = "USER_PASSWORD_RESET"

    COMPANY_CREATED = "COMPANY_CREATED"
    COMPANY_UPDATED = "COMPANY_UPDATED"
    COMPANY_TAGGED = "COMPANY_TAGGED"
    COMPANY_DELETED = "COMPANY_DELETED"
    EDIT_REQUEST_CREATED = "EDIT_REQUEST_CREATED"
    EDIT_REQUEST_APPROVED = "EDIT_REQUEST_APPROVED"
    EDIT_REQUEST_REJECTED = "EDIT_REQUEST_REJECTED"

    MASTER_ENTRY_CREATED = "MASTER_ENTRY_CREATED"
    MASTER_ENTRY_UPDATED = "MASTER_ENTRY_UPDATED"
    MASTER_ENTRY_DELETED = "MASTER_ENTRY_DELETED"

    REPORT_EXPORTED = "REPORT_EXPORTED"
