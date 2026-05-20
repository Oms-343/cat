from datetime import datetime

from pydantic import BaseModel, Field

from app.models.edit_request import EditRequestStatus


class EditRequestCreate(BaseModel):
    proposed_changes: dict = Field(min_length=1)


class EditRequestReview(BaseModel):
    approve: bool
    review_note: str | None = None


class EditRequestOut(BaseModel):
    id: int
    company_id: int
    company_name: str | None
    requested_by_user_id: int
    requested_by_name: str | None
    status: EditRequestStatus
    proposed_changes: dict
    review_note: str | None
    reviewed_by_name: str | None
    created_at: datetime
    reviewed_at: datetime | None
