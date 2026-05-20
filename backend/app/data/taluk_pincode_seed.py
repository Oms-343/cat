"""Sample taluks and pincodes for Coimbatore district (walkthrough demo)."""

# (code, name, district_code)
TALUKS: list[tuple[str, str, str]] = [
    ("CBE_AVN", "Avanashi", "CBE"),
    ("CBE_CBE", "Coimbatore", "CBE"),
    ("CBE_MET", "Mettuppalaiyam", "CBE"),
    ("CBE_POL", "Pollachi", "CBE"),
    ("CBE_TIR", "Tiruppur", "CBE"),
    ("CBE_UDU", "Udumalaippettai", "CBE"),
]

# (code as pincode, name/label, district_code, taluk_code)
PINCODES: list[tuple[str, str, str, str]] = [
    ("641001", "Coimbatore North", "CBE", "CBE_CBE"),
    ("641002", "Coimbatore South", "CBE", "CBE_CBE"),
    ("641004", "Coimbatore East", "CBE", "CBE_CBE"),
    ("641005", "Coimbatore West", "CBE", "CBE_CBE"),
    ("641301", "Pollachi Town", "CBE", "CBE_POL"),
    ("641604", "Tiruppur SIDCO", "CBE", "CBE_TIR"),
]

# Sample HSN codes
HSN_SAMPLE: list[tuple[str, str, str | None]] = [
    ("6109", "T-shirts, singlets and other vests, knitted", "Textile"),
    ("6203", "Men's suits, ensembles, jackets", "Textile"),
    ("7307", "Tube, pipe fittings of iron or steel", "Metal"),
    ("8477", "Machinery for working rubber or plastics", "Machinery"),
    ("8708", "Parts for motor vehicles", "Automotive"),
]
