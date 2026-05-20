from datetime import datetime
from pydantic import BaseModel, Field


class MasterCreate(BaseModel):
    code: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=500)
    is_active: bool = True
    sort_order: int = 0
    district_code: str | None = None
    taluk_code: str | None = None


class MasterUpdate(BaseModel):
    code: str | None = Field(default=None, min_length=1, max_length=64)
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=500)
    is_active: bool | None = None
    sort_order: int | None = None
    district_code: str | None = None
    taluk_code: str | None = None


class MasterOut(BaseModel):
    id: int
    code: str
    name: str
    description: str | None
    is_active: bool
    sort_order: int
    district_code: str | None = None
    taluk_code: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MasterSummary(BaseModel):
    key: str
    label: str
    description: str
    count: int
    active_count: int
