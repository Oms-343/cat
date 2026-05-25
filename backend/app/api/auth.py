from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from app.config import get_settings
from app.core import audit
from app.core.dummy_otp import issue_otp, verify_otp
from app.core.security import create_access_token, hash_password, verify_password
from app.deps import CurrentUser, SessionDep
from app.models.audit import Action
from app.models.user import User, UserRole
from app.schemas.auth import (
    ForgotPasswordRequest,
    ForgotPasswordReset,
    LoginRequest,
    LoginResponse,
    OtpSentResponse,
    PasswordResetSuccess,
)
from app.schemas.user import UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])

OFFICIAL_EMAIL_SUFFIX = "@tidco.com"


def _validate_official_email(email: str) -> None:
    if not email.lower().endswith(OFFICIAL_EMAIL_SUFFIX):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"official users must use an {OFFICIAL_EMAIL_SUFFIX} email address",
        )


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, session: SessionDep) -> LoginResponse:
    email = payload.email.lower().strip()
    _validate_official_email(email)

    user = session.exec(select(User).where(User.email == email)).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="user is inactive")
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="only TIDCO admin accounts can sign in at this time",
        )

    user.last_login_at = datetime.now(timezone.utc)
    audit.record(
        session,
        user,
        Action.USER_LOGIN,
        resource_type="user",
        resource_id=user.id,
        resource_name=user.email,
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    token = create_access_token(subject=user.id, role=user.role.value)
    return LoginResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/forgot-password/request", response_model=OtpSentResponse)
def forgot_password_request(payload: ForgotPasswordRequest, session: SessionDep) -> OtpSentResponse:
    email = payload.email.lower().strip()
    _validate_official_email(email)
    user = session.exec(select(User).where(User.email == email)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="no account with this email")
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="password reset is only available for TIDCO admin accounts",
        )

    settings = get_settings()
    otp = issue_otp(email, "password_reset")
    return OtpSentResponse(
        message="Password reset code sent (demo mode — use the code below).",
        demo_otp=otp,
        expires_in_minutes=settings.dummy_otp_expire_minutes,
    )


@router.post("/forgot-password/reset", response_model=PasswordResetSuccess)
def forgot_password_reset(payload: ForgotPasswordReset, session: SessionDep) -> PasswordResetSuccess:
    email = payload.email.lower().strip()
    try:
        verify_otp(email, "password_reset", payload.otp)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e

    user = session.exec(select(User).where(User.email == email)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="no account with this email")

    user.hashed_password = hash_password(payload.new_password)
    session.add(user)
    session.commit()
    return PasswordResetSuccess(message="Password updated. You can sign in with your new password.")


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser) -> UserOut:
    return UserOut.model_validate(user)
