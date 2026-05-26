"""Token-gated CRUD for company sub-items (enrollment Tab 2)."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Callable, Type

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core import audit
from app.core.enroll_access import require_company_for_invite
from app.deps import SessionDep
from app.models.audit import Action
from app.models.company import Company
from app.models.company_subitem import (
    CompanyCertification,
    CompanyCustomer,
    CompanyMachinery,
    CompanyProduct,
)
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

router = APIRouter(tags=["enrollment-company"])


def _log_enroll(
    session: Session,
    company: Company,
    section: str,
    operation: str,
    item_name: str,
    *,
    invite_token: str,
) -> None:
    audit.record(
        session,
        None,
        Action.COMPANY_UPDATED,
        resource_type="company",
        resource_id=company.id,
        resource_name=company.name,
        details={
            "section": section,
            "operation": operation,
            "item_name": item_name,
            "enroll_token": invite_token,
        },
    )


def _attach_enroll_crud(
    *,
    section: str,
    model: Type[Any],
    out_schema: Type[BaseModel],
    create_schema: Type[BaseModel],
    update_schema: Type[BaseModel],
    item_label: Callable[[Any], str],
) -> None:
    @router.get("/{token}/{section}", response_model=list[out_schema])
    def list_items(token: str, session: SessionDep):
        _invite, company = require_company_for_invite(session, token)
        rows = session.exec(
            select(model).where(model.company_id == company.id).order_by(
                getattr(model, "sort_order", model.id), model.id
            )
        ).all()
        return [out_schema.model_validate(r) for r in rows]

    @router.post(
        "/{token}/{section}",
        response_model=out_schema,
        status_code=status.HTTP_201_CREATED,
    )
    def create_item(
        token: str,
        payload: create_schema,  # type: ignore[valid-type]
        session: SessionDep,
    ):
        _invite, company = require_company_for_invite(session, token)
        item = model(company_id=company.id, **payload.model_dump())
        session.add(item)
        session.flush()
        _log_enroll(session, company, section, "added", item_label(item), invite_token=token)
        session.commit()
        session.refresh(item)
        return out_schema.model_validate(item)

    @router.patch("/{token}/{section}/{item_id}", response_model=out_schema)
    def update_item(
        token: str,
        item_id: int,
        payload: update_schema,  # type: ignore[valid-type]
        session: SessionDep,
    ):
        _invite, company = require_company_for_invite(session, token)
        item = session.get(model, item_id)
        if not item or item.company_id != company.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="item not found")
        data = payload.model_dump(exclude_unset=True)
        for field, value in data.items():
            setattr(item, field, value)
        if hasattr(item, "updated_at"):
            item.updated_at = datetime.now(timezone.utc)
        session.add(item)
        _log_enroll(session, company, section, "updated", item_label(item), invite_token=token)
        session.commit()
        session.refresh(item)
        return out_schema.model_validate(item)

    @router.delete("/{token}/{section}/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
    def delete_item(token: str, item_id: int, session: SessionDep):
        _invite, company = require_company_for_invite(session, token)
        item = session.get(model, item_id)
        if not item or item.company_id != company.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="item not found")
        name = item_label(item)
        session.delete(item)
        _log_enroll(session, company, section, "removed", name, invite_token=token)
        session.commit()


_attach_enroll_crud(
    section="products",
    model=CompanyProduct,
    out_schema=ProductOut,
    create_schema=ProductCreate,
    update_schema=ProductUpdate,
    item_label=lambda p: p.name,
)
_attach_enroll_crud(
    section="certifications",
    model=CompanyCertification,
    out_schema=CertificationOut,
    create_schema=CertificationCreate,
    update_schema=CertificationUpdate,
    item_label=lambda c: c.certification_code,
)
_attach_enroll_crud(
    section="customers",
    model=CompanyCustomer,
    out_schema=CustomerOut,
    create_schema=CustomerCreate,
    update_schema=CustomerUpdate,
    item_label=lambda c: c.name,
)
_attach_enroll_crud(
    section="machinery",
    model=CompanyMachinery,
    out_schema=MachineryOut,
    create_schema=MachineryCreate,
    update_schema=MachineryUpdate,
    item_label=lambda m: m.name,
)
