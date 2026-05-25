"""Pincode → taluk mappings for seed companies and demo drill-down.

Taluk codes match tn-taluks-index.json / GeoJSON boundaries.
Full taluk master data is synced from that index at seed/migrate time.
"""

# (pincode, label, district_code, taluk_code)
PINCODES: list[tuple[str, str, str, str]] = [
    # Coimbatore
    ("641001", "Coimbatore North", "CBE", "CBE_CBE"),
    ("641002", "Coimbatore South", "CBE", "CBE_CBE"),
    ("641004", "Coimbatore East", "CBE", "CBE_CBE"),
    ("641005", "Coimbatore West", "CBE", "CBE_CBE"),
    ("641014", "Coimbatore Peelamedu", "CBE", "CBE_CBE"),
    ("641301", "Pollachi Town", "CBE", "CBE_POL"),
    # Chennai
    ("600045", "Guindy / MEPZ", "CHN", "CHN_GUINDY"),
    ("600119", "OMR / Sholinganallur", "CHN", "CHN_VELACHERY"),
    # Tiruppur
    ("641604", "Tiruppur SIDCO", "TRP", "TRP_TIRUPPURNORT"),
    ("641606", "Tiruppur Garment Hub", "TRP", "TRP_TIRUPPURNORT"),
    ("641607", "Tiruppur Mannarai", "TRP", "TRP_TIRUPPURNORT"),
    # Salem
    ("636302", "Salem SIPCOT", "SLM", "SLM_05740"),
    # Madurai
    ("625001", "Madurai City", "MDU", "MDU_MADURAI_EAST"),
    ("625019", "Madurai South", "MDU", "MDU_05841"),
    # Erode
    ("638011", "Erode Perundurai", "ERD", "ERD_05753"),
    # Tiruchirappalli
    ("620014", "Tiruchirappalli BHEL", "TRI", "TRI_05779"),
    # Krishnagiri
    ("635126", "Hosur SIPCOT", "KRI", "KRI_05890"),
    # Virudhunagar
    ("626123", "Sivakasi", "VDN", "VDN_05849"),
    # Thanjavur
    ("613001", "Thanjavur", "TJV", "TJV_05814"),
    # Karur
    ("639002", "Karur", "KAR", "KAR_05769"),
    # Ranipet
    ("632403", "Ranipet Leather", "RNP", "RNP_05714"),
    # Chengalpattu
    ("603002", "Chengalpattu MWC", "CGL", "CGL_05706"),
    # Kanyakumari
    ("629251", "Colachel", "KNY", "KNY_05884"),
    # Vellore
    ("632007", "Vellore Katpadi", "VLR", "VLR_05713"),
    # Dharmapuri
    ("636701", "Dharmapuri", "DHR", "DHR_05888"),
    # Nilgiris
    ("643102", "Coonoor", "NLG", "NLG_05758"),
    # Tiruvallur
    ("601201", "Gummidipoondi", "TVR", "TVR_05693"),
    # Theni
    ("625531", "Theni", "THI", "THI_05843"),
]

# Sample HSN codes
HSN_SAMPLE: list[tuple[str, str, str | None]] = [
    ("6109", "T-shirts, singlets and other vests, knitted", "Textile"),
    ("6203", "Men's suits, ensembles, jackets", "Textile"),
    ("7307", "Tube, pipe fittings of iron or steel", "Metal"),
    ("8477", "Machinery for working rubber or plastics", "Machinery"),
    ("8708", "Parts for motor vehicles", "Automotive"),
]
