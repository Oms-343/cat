from datetime import datetime, timezone
from pydantic import BaseModel, field_serializer


class AuditLogOut(BaseModel):
    id: int
    timestamp: datetime
    user_id: int | None
    user_email: str | None
    user_role: str | None
    user_name: str | None
    action: str
    resource_type: str | None
    resource_id: int | None
    resource_name: str | None
    details: dict

    class Config:
        from_attributes = True

    @field_serializer("timestamp")
    def serialize_timestamp(self, value: datetime) -> str:
        # Timestamps are recorded in UTC but SQLite stores them naive (no
        # tzinfo). Assume naive datetimes are UTC and emit an explicit offset
        # so clients convert to local time correctly.
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc).isoformat()


class AuditLogList(BaseModel):
    items: list[AuditLogOut]
    total: int
    limit: int
    offset: int
