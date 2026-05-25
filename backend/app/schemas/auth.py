from pydantic import BaseModel, EmailStr, Field, field_validator
from app.schemas.user import UserOut


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordReset(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=4, max_length=8)
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("password must include at least one capital letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("password must include at least one number")
        if not any(c in "!@#$%^&*()_+-=[]{}|;:',.<>?/" for c in v):
            raise ValueError("password must include at least one special character")
        return v


class OtpSentResponse(BaseModel):
    message: str
    demo_otp: str
    expires_in_minutes: int


class PasswordResetSuccess(BaseModel):
    message: str
