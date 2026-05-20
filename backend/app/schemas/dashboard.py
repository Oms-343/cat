from pydantic import BaseModel


class RegionCount(BaseModel):
    code: str
    name: str
    company_count: int


class DistrictsOverview(BaseModel):
    total_companies: int
    total_districts_with_msmes: int
    items: list[RegionCount]


class TalukDrilldown(BaseModel):
    district_code: str
    district_name: str
    total_companies: int
    items: list[RegionCount]


class PincodeCount(BaseModel):
    pincode: str
    company_count: int


class TalukPincodeDrilldown(BaseModel):
    district_code: str
    district_name: str
    taluk_code: str
    taluk_name: str
    total_companies: int
    items: list[PincodeCount]


class DistrictDrilldown(BaseModel):
    """Legacy alias — district → pincodes without taluk."""
    district_code: str
    district_name: str
    total_companies: int
    items: list[PincodeCount]
