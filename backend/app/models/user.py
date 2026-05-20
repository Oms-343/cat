from datetime import datetime, timezone
from enum import Enum
from sqlmodel import Field, SQLModel


class UserRole(str, Enum):
    SUPER = "super"
    ADMIN = "admin"
    MSME = "msme"


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    full_name: str
    designation: str | None = None
    mobile: str | None = None
    role: UserRole = Field(default=UserRole.MSME, index=True)
    hashed_password: str
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login_at: datetime | None = None
