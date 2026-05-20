from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from app.config import get_settings
from app.core import audit
from app.core.dummy_otp import issue_otp, verify_otp
from app.core.security import create_access_token, hash_password, verify_password
from app.data.govt_mock import lookup_govt_record
from app.deps import CurrentUser, SessionDep
from app.models.audit import Action
from app.models.company import Company
from app.models.user import User, UserRole
from app.schemas.auth import (
    ForgotPasswordRequest,
    ForgotPasswordReset,
    LoginRequest,
    LoginResponse,
    OtpSentResponse,
    PasswordResetSuccess,
    SignupRequestOtp,
    SignupVerifyOtp,
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

    if payload.user_type == "official":
        _validate_official_email(email)
    elif payload.user_type == "msme" and email.endswith(OFFICIAL_EMAIL_SUFFIX):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MSME users should not use a TIDCO official email",
        )

    user = session.exec(select(User).where(User.email == email)).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="user is inactive")

    if payload.user_type == "msme" and user.role != UserRole.MSME:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="this account is not an MSME user")
    if payload.user_type == "official" and user.role == UserRole.MSME:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="this account is not an official user")

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


@router.post("/signup/request-otp", response_model=OtpSentResponse)
def signup_request_otp(payload: SignupRequestOtp, session: SessionDep) -> OtpSentResponse:
    if payload.user_type != UserRole.MSME:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="self-service signup is only available for MSME users",
        )
    email = payload.email.lower().strip()
    if email.endswith(OFFICIAL_EMAIL_SUFFIX):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MSME signup cannot use a TIDCO official email",
        )
    existing = session.exec(select(User).where(User.email == email)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="email already registered")

    settings = get_settings()
    extra: dict = {}
    if payload.gst_number:
        extra["gst_number"] = payload.gst_number.strip().upper()
    otp = issue_otp(
        email,
        "signup",
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        role=UserRole.MSME.value,
        extra=extra,
    )
    return OtpSentResponse(
        message="Verification code sent (demo mode — use the code below).",
        demo_otp=otp,
        expires_in_minutes=settings.dummy_otp_expire_minutes,
    )


@router.post("/signup/verify", response_model=LoginResponse)
def signup_verify(payload: SignupVerifyOtp, session: SessionDep) -> LoginResponse:
    email = payload.email.lower().strip()
    try:
        ch = verify_otp(email, "signup", payload.otp)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e

    if session.exec(select(User).where(User.email == email)).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="email already registered")

    user = User(
        email=email,
        full_name=ch.full_name or email,
        role=UserRole.MSME,
        hashed_password=ch.password_hash or hash_password("ChangeMe1!"),
        is_active=True,
    )
    session.add(user)
    session.flush()

    govt = lookup_govt_record(ch.extra.get("gst_number"))
    company = Company(
        owner_user_id=user.id,
        name=govt["name"],
        legal_structure_code=govt.get("legal_structure_code"),
        primary_place_of_business=govt.get("primary_place_of_business"),
        gst_number=govt.get("gst_number"),
        cin=govt.get("cin"),
        udyam_number=govt.get("udyam_number"),
        pan=govt.get("pan"),
        district_code=govt.get("district_code"),
        sector_code=govt.get("sector_code"),
        contact_email=email,
        contact_name=ch.full_name,
    )
    session.add(company)
    session.flush()

    audit.record(
        session,
        user,
        Action.USER_CREATED,
        resource_type="user",
        resource_id=user.id,
        resource_name=user.email,
        details={"source": "self_signup"},
    )
    audit.record(
        session,
        user,
        Action.COMPANY_CREATED,
        resource_type="company",
        resource_id=company.id,
        resource_name=company.name,
        details={"source": "govt_mock_prefill"},
    )
    session.commit()
    session.refresh(user)

    token = create_access_token(subject=user.id, role=user.role.value)
    return LoginResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/forgot-password/request", response_model=OtpSentResponse)
def forgot_password_request(payload: ForgotPasswordRequest, session: SessionDep) -> OtpSentResponse:
    email = payload.email.lower().strip()
    user = session.exec(select(User).where(User.email == email)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="no account with this email")

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


@router.get("/govt-lookup")
def govt_lookup(gst: str | None = None) -> dict:
    """Dummy GST/Udyam prefill for MSME onboarding."""
    return lookup_govt_record(gst)


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser) -> UserOut:
    return UserOut.model_validate(user)
