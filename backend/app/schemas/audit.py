from datetime import datetime
from pydantic import BaseModel


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


class AuditLogList(BaseModel):
    items: list[AuditLogOut]
    total: int
    limit: int
    offset: int
