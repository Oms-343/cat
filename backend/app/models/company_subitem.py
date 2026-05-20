"""Related sub-items that fill out the company profile (sections 3-6).

Each is a simple child of the Company table. They live in separate models because
their attribute sets differ — Products have HSN + tags, Certifications have dates,
Customers have a type/country, Machinery has capacity unit/value.
"""
from datetime import date, datetime, timezone
from enum import Enum
from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class CustomerType(str, Enum):
    BUSINESS = "business"
    GOVERNMENT = "government"
    EXPORT = "export"


class CompanyProduct(SQLModel, table=True):
    __tablename__ = "company_products"

    id: int | None = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="companies.id", index=True)

    name: str = Field(max_length=200)
    description: str | None = Field(default=None, max_length=1000)
    hsn_code: str | None = Field(default=None, max_length=64)
    image_url: str | None = Field(default=None, max_length=500)
    tags: list[str] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    sort_order: int = Field(default=0)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CompanyCertification(SQLModel, table=True):
    __tablename__ = "company_certifications"

    id: int | None = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="companies.id", index=True)

    certification_code: str = Field(index=True, max_length=64)  # ref master_certifications.code
    certificate_number: str | None = Field(default=None, max_length=128)
    issued_date: date | None = None
    expiry_date: date | None = None
    issuer: str | None = Field(default=None, max_length=200)
    notes: str | None = Field(default=None, max_length=500)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CompanyCustomer(SQLModel, table=True):
    __tablename__ = "company_customers"

    id: int | None = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="companies.id", index=True)

    name: str = Field(max_length=200)
    customer_type: CustomerType = Field(default=CustomerType.BUSINESS, index=True)
    country: str | None = Field(default=None, max_length=100)  # mostly used for EXPORT
    relationship_years: int | None = Field(default=None, ge=0)
    notes: str | None = Field(default=None, max_length=500)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CompanyMachinery(SQLModel, table=True):
    __tablename__ = "company_machinery"

    id: int | None = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="companies.id", index=True)

    name: str = Field(max_length=200)
    quantity: int | None = Field(default=None, ge=0)
    capacity_value: float | None = Field(default=None, ge=0)
    capacity_unit: str | None = Field(default=None, max_length=64)  # ref production-capacities master
    description: str | None = Field(default=None, max_length=500)
    sort_order: int = Field(default=0)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
