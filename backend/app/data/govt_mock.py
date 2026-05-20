"""Dummy government-record lookups (GST / Udyam) for dev onboarding."""

GOVT_BY_GST: dict[str, dict] = {
    "33ABCXY1234R1Z5": {
        "name": "Velocity Knit Industries",
        "legal_structure_code": "PVT",
        "primary_place_of_business": "Plot 14, SIDCO Industrial Estate, Tiruppur",
        "gst_number": "33ABCXY1234R1Z5",
        "cin": "U17299TN2010PTC074521",
        "udyam_number": "UDYAM-TN-15-0012345",
        "pan": "ABCXY1234R",
        "district_code": "TRP",
        "sector_code": "TXT_KNIT",
    },
}

DEFAULT_MOCK = {
    "name": "New MSME Unit",
    "legal_structure_code": "PVT",
    "primary_place_of_business": "Tamil Nadu",
    "gst_number": None,
    "cin": None,
    "udyam_number": None,
    "pan": None,
    "district_code": "CHN",
    "sector_code": "TXT_APP",
}


def lookup_govt_record(gst_number: str | None = None) -> dict:
    if gst_number:
        key = gst_number.strip().upper()
        if key in GOVT_BY_GST:
            return dict(GOVT_BY_GST[key])
    return dict(DEFAULT_MOCK)
