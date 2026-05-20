from datetime import date, datetime
from pydantic import BaseModel, Field
from app.models.company_subitem import CustomerType


# --- Products -------------------------------------------------------------

class ProductBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    hsn_code: str | None = None
    image_url: str | None = None
    tags: list[str] = []
    sort_order: int = 0


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    hsn_code: str | None = None
    image_url: str | None = None
    tags: list[str] | None = None
    sort_order: int | None = None


class ProductOut(ProductBase):
    id: int
    company_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Certifications -------------------------------------------------------

class CertificationBase(BaseModel):
    certification_code: str = Field(min_length=1, max_length=64)
    certificate_number: str | None = None
    issued_date: date | None = None
    expiry_date: date | None = None
    issuer: str | None = None
    notes: str | None = None


class CertificationCreate(CertificationBase):
    pass


class CertificationUpdate(BaseModel):
    certification_code: str | None = Field(default=None, min_length=1, max_length=64)
    certificate_number: str | None = None
    issued_date: date | None = None
    expiry_date: date | None = None
    issuer: str | None = None
    notes: str | None = None


class CertificationOut(CertificationBase):
    id: int
    company_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Customers ------------------------------------------------------------

class CustomerBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    customer_type: CustomerType = CustomerType.BUSINESS
    country: str | None = None
    relationship_years: int | None = Field(default=None, ge=0)
    notes: str | None = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    customer_type: CustomerType | None = None
    country: str | None = None
    relationship_years: int | None = Field(default=None, ge=0)
    notes: str | None = None


class CustomerOut(CustomerBase):
    id: int
    company_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Machinery ------------------------------------------------------------

class MachineryBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    quantity: int | None = Field(default=None, ge=0)
    capacity_value: float | None = Field(default=None, ge=0)
    capacity_unit: str | None = None
    description: str | None = None
    sort_order: int = 0


class MachineryCreate(MachineryBase):
    pass


class MachineryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    quantity: int | None = Field(default=None, ge=0)
    capacity_value: float | None = Field(default=None, ge=0)
    capacity_unit: str | None = None
    description: str | None = None
    sort_order: int | None = None


class MachineryOut(MachineryBase):
    id: int
    company_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
