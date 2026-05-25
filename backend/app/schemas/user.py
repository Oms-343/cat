from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from app.models.user import UserRole


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    designation: str | None = None
    mobile: str | None = None
    role: UserRole
    is_active: bool
    created_at: datetime
    last_login_at: datetime | None = None

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=200)
    designation: str | None = None
    mobile: str | None = None
    role: UserRole = UserRole.ADMIN
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=200)
    designation: str | None = None
    mobile: str | None = None
    role: UserRole | None = None
    is_active: bool | None = None


class PasswordResetResponse(BaseModel):
    user_id: int
    email: EmailStr
    temporary_password: str


class UserCreateResponse(BaseModel):
    user: UserOut
    welcome_message: str
