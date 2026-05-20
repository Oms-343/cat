"""Master data tables.

All 9 masters share the same schema for now (id/code/name/description/is_active/sort_order
+ timestamps). They live in separate tables so future features can attach domain-specific
columns (e.g. district FK on pincode, min/max lakhs on turnover range) without migrations
to a generic table.
"""
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel


class _MasterCommon(SQLModel):
    id: int | None = Field(default=None, primary_key=True)
    code: str = Field(index=True, max_length=64)
    name: str = Field(index=True, max_length=200)
    description: str | None = Field(default=None, max_length=500)
    is_active: bool = Field(default=True, index=True)
    sort_order: int = Field(default=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DistrictMaster(_MasterCommon, table=True):
    __tablename__ = "master_districts"


class TalukMaster(_MasterCommon, table=True):
    __tablename__ = "master_taluks"
    district_code: str = Field(index=True, max_length=64)


class PincodeMaster(_MasterCommon, table=True):
    __tablename__ = "master_pincodes"
    district_code: str | None = Field(default=None, index=True, max_length=64)
    taluk_code: str | None = Field(default=None, index=True, max_length=64)


class HSNCodeMaster(_MasterCommon, table=True):
    __tablename__ = "master_hsn_codes"


class CompanyTypeMaster(_MasterCommon, table=True):
    __tablename__ = "master_company_types"


class LegalStructureMaster(_MasterCommon, table=True):
    __tablename__ = "master_legal_structures"


class TurnoverRangeMaster(_MasterCommon, table=True):
    __tablename__ = "master_turnover_ranges"


class SectorMaster(_MasterCommon, table=True):
    __tablename__ = "master_sectors"


class ProductionCapacityMaster(_MasterCommon, table=True):
    __tablename__ = "master_production_capacities"


class CertificationMaster(_MasterCommon, table=True):
    __tablename__ = "master_certifications"


MASTERS: dict[str, dict] = {
    "districts": {"model": DistrictMaster, "label": "District Master", "description": "Tamil Nadu districts"},
    "taluks": {"model": TalukMaster, "label": "Taluk Master", "description": "Taluks within districts"},
    "pincodes": {"model": PincodeMaster, "label": "Pin Code Master", "description": "Pin codes across Tamil Nadu"},
    "hsn-codes": {"model": HSNCodeMaster, "label": "HSN / SIC Code Master", "description": "Product classification codes"},
    "company-types": {"model": CompanyTypeMaster, "label": "Company Type Master", "description": "Government / Private / Public"},
    "legal-structures": {"model": LegalStructureMaster, "label": "Legal Structure Master", "description": "Proprietorship, Pvt Ltd, LLP, etc."},
    "turnover-ranges": {"model": TurnoverRangeMaster, "label": "Turnover Range Master", "description": "Revenue brackets (Micro / Small / Medium)"},
    "sectors": {"model": SectorMaster, "label": "Sector Master", "description": "Industry sectors"},
    "production-capacities": {"model": ProductionCapacityMaster, "label": "Production Capacity Master", "description": "Units of measurement"},
    "certifications": {"model": CertificationMaster, "label": "Certifications Master", "description": "Quality certifications"},
}
