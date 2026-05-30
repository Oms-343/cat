"""Pincode → taluk mappings for Tamil Nadu (auto-generated).

Do not edit by hand. Regenerate with:
  python backend/scripts/build_taluk_pincode_seed.py
"""

import json
from pathlib import Path

_DATA_PATH = Path(__file__).resolve().parent / "taluk_pincodes.json"


def _load_pincodes() -> list[tuple[str, str, str, str]]:
    raw = json.loads(_DATA_PATH.read_text(encoding="utf-8"))
    return [(r["pincode"], r["label"], r["district_code"], r["taluk_code"]) for r in raw]


PINCODES: list[tuple[str, str, str, str]] = _load_pincodes()

# Sample HSN codes
HSN_SAMPLE: list[tuple[str, str, str | None]] = [
    ("6109", "T-shirts, singlets and other vests, knitted", "Textile"),
    ("6203", "Men's suits, ensembles, jackets", "Textile"),
    ("7307", "Tube, pipe fittings of iron or steel", "Metal"),
    ("8477", "Machinery for working rubber or plastics", "Machinery"),
    ("8708", "Parts for motor vehicles", "Automotive"),
]
