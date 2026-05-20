"""CRUD endpoints for company sub-items (products, certifications, customers, machinery).

All four share the same RBAC model as the parent company:
  - super/admin: edit any company's sub-items
  - msme: edit only their own company's sub-items
Audit-logged as COMPANY_UPDATED with details indicating the section + operation.
"""
from datetime import datetime, timezone
from typing import Any, Callable, Type

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlmodel import select

from app.core import audit
from app.deps import CurrentUser, SessionDep
from app.models.audit import Action
from app.models.company import Company
from app.models.company_subitem import (
    CompanyCertification,
    CompanyCustomer,
    CompanyMachinery,
    CompanyProduct,
)
from app.models.user import User, UserRole
from app.schemas.company_subitem import (
    CertificationCreate,
    CertificationOut,
    CertificationUpdate,
    CustomerCreate,
    CustomerOut,
    CustomerUpdate,
    MachineryCreate,
    MachineryOut,
    MachineryUpdate,
    ProductCreate,
    ProductOut,
    ProductUpdate,
)

router = APIRouter(prefix="/api/companies/{company_id}", tags=["company-subitems"])


def _require_company_edit(session, company_id: int, user: User) -> Company:
    company = session.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="company not found")
    if user.role == UserRole.MSME and company.owner_user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="MSME users can only edit their own company profile",
        )
    return company


def _log(session, user: User, company: Company, section: str, operation: str, item_name: str) -> None:
    audit.record(
        session,
        user,
        Action.COMPANY_UPDATED,
        resource_type="company",
        resource_id=company.id,
        resource_name=company.name,
        details={"section": section, "operation": operation, "item_name": item_name},
    )


def _attach_crud(
    *,
    section: str,        # "products" | "certifications" | "customers" | "machinery"
    model: Type[Any],
    out_schema: Type[BaseModel],
    create_schema: Type[BaseModel],
    update_schema: Type[BaseModel],
    item_label: Callable[[Any], str],
    allow_anyone_to_view: bool = True,
) -> None:
    """Attach list/get/create/update/delete handlers for one subitem type."""

    @router.get(f"/{section}", response_model=list[out_schema])
    def list_items(company_id: int, session: SessionDep, _user: CurrentUser):
        company = session.get(Company, company_id)
        if not company:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="company not found")
        rows = session.exec(
            select(model).where(model.company_id == company_id).order_by(
                getattr(model, "sort_order", model.id), model.id
            )
        ).all()
        return [out_schema.model_validate(r) for r in rows]

    @router.post(
        f"/{section}",
        response_model=out_schema,
        status_code=status.HTTP_201_CREATED,
    )
    def create_item(
        company_id: int,
        payload: create_schema,  # type: ignore[valid-type]
        session: SessionDep,
        user: CurrentUser,
    ):
        company = _require_company_edit(session, company_id, user)
        item = model(company_id=company_id, **payload.model_dump())
        session.add(item)
        session.flush()
        _log(session, user, company, section, "added", item_label(item))
        session.commit()
        session.refresh(item)
        return out_schema.model_validate(item)

    @router.patch(f"/{section}/{{item_id}}", response_model=out_schema)
    def update_item(
        company_id: int,
        item_id: int,
        payload: update_schema,  # type: ignore[valid-type]
        session: SessionDep,
        user: CurrentUser,
    ):
        company = _require_company_edit(session, company_id, user)
        item = session.get(model, item_id)
        if not item or item.company_id != company_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="item not found")

        data = payload.model_dump(exclude_unset=True)
        changed: list[str] = []
        for field, value in data.items():
            if getattr(item, field) != value:
                setattr(item, field, value)
                changed.append(field)
        if hasattr(item, "updated_at"):
            item.updated_at = datetime.now(timezone.utc)

        if changed:
            _log(session, user, company, section, "updated", item_label(item))

        session.add(item)
        session.commit()
        session.refresh(item)
        return out_schema.model_validate(item)

    @router.delete(
        f"/{section}/{{item_id}}",
        status_code=status.HTTP_204_NO_CONTENT,
    )
    def delete_item(
        company_id: int,
        item_id: int,
        session: SessionDep,
        user: CurrentUser,
    ):
        company = _require_company_edit(session, company_id, user)
        item = session.get(model, item_id)
        if not item or item.company_id != company_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="item not found")
        name = item_label(item)
        session.delete(item)
        _log(session, user, company, section, "removed", name)
        session.commit()


_attach_crud(
    section="products",
    model=CompanyProduct,
    out_schema=ProductOut,
    create_schema=ProductCreate,
    update_schema=ProductUpdate,
    item_label=lambda p: p.name,
)

_attach_crud(
    section="certifications",
    model=CompanyCertification,
    out_schema=CertificationOut,
    create_schema=CertificationCreate,
    update_schema=CertificationUpdate,
    item_label=lambda c: c.certification_code,
)

_attach_crud(
    section="customers",
    model=CompanyCustomer,
    out_schema=CustomerOut,
    create_schema=CustomerCreate,
    update_schema=CustomerUpdate,
    item_label=lambda c: c.name,
)

_attach_crud(
    section="machinery",
    model=CompanyMachinery,
    out_schema=MachineryOut,
    create_schema=MachineryCreate,
    update_schema=MachineryUpdate,
    item_label=lambda m: m.name,
)
