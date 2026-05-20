from datetime import datetime
from typing import Any
from pydantic import BaseModel


class ReportFilterSpec(BaseModel):
    key: str
    label: str
    type: str  # "master" | "string" | "date"
    master_key: str | None = None
    required: bool = False


class ReportMeta(BaseModel):
    slug: str
    name: str
    description: str
    icon: str
    filters: list[ReportFilterSpec]


class ReportColumn(BaseModel):
    key: str
    label: str
    format: str | None = None


class ReportRunResult(BaseModel):
    slug: str
    name: str
    filters_applied: dict[str, Any]
    columns: list[ReportColumn]
    rows: list[dict[str, Any]]
    summary: dict[str, Any]
    sheets: dict[str, dict[str, Any]] = {}  # name -> {columns, rows}
    generated_at: datetime


class ReportRunOut(BaseModel):
    id: int
    timestamp: datetime
    report_slug: str
    report_name: str
    format: str
    row_count: int
    filters: dict[str, Any]
    user_id: int | None
    user_email: str | None
    user_role: str | None
    user_name: str | None

    class Config:
        from_attributes = True


class ReportHistoryList(BaseModel):
    items: list[ReportRunOut]
    total: int
