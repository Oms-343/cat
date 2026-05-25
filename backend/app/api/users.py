import secrets
import string
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import func, or_, select
from app.core import audit
from app.core.security import hash_password
from app.deps import CurrentUser, SessionDep, require_roles
from app.models.audit import Action
from app.models.user import User, UserRole
from app.schemas.user import (
    PasswordResetResponse,
    UserCreate,
    UserCreateResponse,
    UserOut,
    UserUpdate,
)

router = APIRouter(prefix="/api/users", tags=["users"])


def _gen_temp_password(length: int = 12) -> str:
    """Generate a random URL-safe temp password with at least one upper/digit/symbol."""
    alphabet = string.ascii_letters + string.digits + "!@#$%&"
    while True:
        pw = "".join(secrets.choice(alphabet) for _ in range(length))
        if (
            any(c.isupper() for c in pw)
            and any(c.isdigit() for c in pw)
            and any(c in "!@#$%&" for c in pw)
        ):
            return pw


@router.get("", response_model=list[UserOut])
def list_users(
    session: SessionDep,
    _: User = Depends(require_roles(UserRole.ADMIN)),
    q: str | None = Query(default=None, description="search by name or email"),
    role: UserRole | None = Query(default=None),
    active: bool | None = Query(default=None),
) -> list[UserOut]:
    stmt = select(User)
    if q:
        like = f"%{q.lower()}%"
        stmt = stmt.where(
            or_(func.lower(User.full_name).like(like), func.lower(User.email).like(like))
        )
    if role:
        stmt = stmt.where(User.role == role)
    if active is not None:
        stmt = stmt.where(User.is_active == active)
    rows = session.exec(stmt.order_by(User.created_at.desc())).all()
    return [UserOut.model_validate(u) for u in rows]


@router.post(
    "",
    response_model=UserCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    payload: UserCreate,
    session: SessionDep,
    actor: User = Depends(require_roles(UserRole.ADMIN)),
) -> UserCreateResponse:
    existing = session.exec(select(User).where(User.email == payload.email)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"user with email {payload.email} already exists",
        )

    initial_password = payload.password or _gen_temp_password()
    user = User(
        email=payload.email,
        full_name=payload.full_name,
        designation=payload.designation,
        mobile=payload.mobile,
        role=payload.role,
        hashed_password=hash_password(initial_password),
        is_active=True,
    )
    session.add(user)
    session.flush()  # populate user.id for audit log

    audit.record(
        session,
        actor,
        Action.USER_CREATED,
        resource_type="user",
        resource_id=user.id,
        resource_name=user.email,
        details={"role": user.role.value, "password_set_by_admin": payload.password is None},
    )
    session.commit()
    session.refresh(user)
    welcome = (
        f"Welcome email (demo): Hi {user.full_name}, your MSME Platform account is ready. "
        f"Sign in at the portal with {user.email}"
        + (f" and temporary password: {initial_password}" if payload.password is None else ".")
    )
    return UserCreateResponse(user=UserOut.model_validate(user), welcome_message=welcome)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    session: SessionDep,
    actor: CurrentUser,
) -> UserOut:
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="user not found")

    is_self = actor.id == user.id
    is_tidco = actor.role == UserRole.ADMIN
    if not is_self and not is_tidco:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="you can only edit your own profile",
        )

    data = payload.model_dump(exclude_unset=True)

    # Only admin can change roles or activation status.
    if ("role" in data or "is_active" in data) and actor.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="only admin users can change role or activation status",
        )

    changed: list[str] = []
    for field, value in data.items():
        if getattr(user, field) != value:
            setattr(user, field, value)
            changed.append(field)

    if not changed:
        return UserOut.model_validate(user)

    audit.record(
        session,
        actor,
        Action.USER_UPDATED,
        resource_type="user",
        resource_id=user.id,
        resource_name=user.email,
        details={"fields_changed": changed},
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return UserOut.model_validate(user)


@router.post(
    "/{user_id}/reset-password",
    response_model=PasswordResetResponse,
)
def reset_password(
    user_id: int,
    session: SessionDep,
    actor: User = Depends(require_roles(UserRole.ADMIN)),
) -> PasswordResetResponse:
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="user not found")

    temp = _gen_temp_password()
    user.hashed_password = hash_password(temp)
    audit.record(
        session,
        actor,
        Action.USER_PASSWORD_RESET,
        resource_type="user",
        resource_id=user.id,
        resource_name=user.email,
        details={"target_user_email": user.email},
    )
    session.add(user)
    session.commit()
    return PasswordResetResponse(user_id=user.id, email=user.email, temporary_password=temp)


@router.post(
    "/{user_id}/deactivate",
    response_model=UserOut,
)
def deactivate_user(
    user_id: int,
    session: SessionDep,
    actor: User = Depends(require_roles(UserRole.ADMIN)),
) -> UserOut:
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="user not found")
    if user.id == actor.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="you cannot deactivate your own account",
        )
    if not user.is_active:
        return UserOut.model_validate(user)
    user.is_active = False
    audit.record(
        session,
        actor,
        Action.USER_DEACTIVATED,
        resource_type="user",
        resource_id=user.id,
        resource_name=user.email,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return UserOut.model_validate(user)
