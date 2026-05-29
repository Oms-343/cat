"""Realistic-looking seed companies spread across TN districts and sectors.

Master codes used here must exist in app.data.master_seed (districts / sectors /
legal-structures / turnover-ranges). Mismatches will leave those fields dangling
but the companies still seed.

The first ~25 entries are hand-curated (used for demo/showcase wiring in seed.py).
A larger batch of companies is generated deterministically at the bottom of this
file so dashboards, search and geo distribution have enough realistic data.
"""

import random as _random

# (name, sector_code, district_code, turnover_code, legal_code, business_activity,
#  city, pincode, gst, cin, udyam, pan, contact_name, contact_email, contact_phone,
#  workforce, exact_turnover_lakhs, website, tags)
COMPANIES: list[dict] = [
    {
        "name": "Velocity Knit Industries",
        "sector_code": "TXT_KNIT",
        "district_code": "CBE",
        "taluk_code": "TRP_TIRUPPURNORT",
        "turnover_range_code": "SMALL_20_50",
        "legal_structure_code": "PVT",
        "business_activity": "manufacturing",
        "primary_place_of_business": "Plot 14, SIDCO Industrial Estate, Tiruppur",
        "address_line1": "Plot 14, SIDCO Industrial Estate",
        "city": "Tiruppur",
        "pincode": "641604",
        "gst_number": "33ABCXY1234R1Z5",
        "cin": "U17299TN2010PTC074521",
        "udyam_number": "UDYAM-TN-15-0012345",
        "pan": "ABCXY1234R",
        "contact_name": "R. Kumaresan",
        "contact_designation": "Managing Director",
        "contact_email": "md@velocityknit.example",
        "contact_phone": "+919876543210",
        "website": "https://velocityknit.example",
        "workforce_count": 245,
        "exact_turnover_lakhs": 3200,
        "is_mnc": False,
        "tags": ["Export"],
    },
    {
        "name": "Salem Steel Forgings",
        "sector_code": "FORG",
        "district_code": "SLM",
        "turnover_range_code": "MED_50_100",
        "legal_structure_code": "PVT",
        "business_activity": "manufacturing",
        "primary_place_of_business": "SIPCOT Industrial Complex, Salem",
        "address_line1": "Unit 7, SIPCOT Industrial Complex",
        "city": "Salem",
        "pincode": "636302",
        "gst_number": "33AABCS5678P1Z2",
        "cin": "U27109TN2005PTC056234",
        "udyam_number": "UDYAM-TN-23-0023456",
        "pan": "AABCS5678P",
        "contact_name": "S. Murugan",
        "contact_designation": "CEO",
        "contact_email": "ceo@salemsteelforge.example",
        "contact_phone": "+919876512340",
        "workforce_count": 412,
        "exact_turnover_lakhs": 7800,
        "is_mnc": False,
        "tags": ["Defence", "Forging"],
    },
    {
        "name": "Madurai Spinning Mills",
        "sector_code": "TXT_APP",
        "district_code": "MDU",
        "turnover_range_code": "SMALL_20_50",
        "legal_structure_code": "PVT",
        "business_activity": "manufacturing",
        "address_line1": "Madurai-Theni Highway, KM 12",
        "city": "Madurai",
        "pincode": "625019",
        "gst_number": "33AAACM4567Q1Z8",
        "cin": "U17112TN1998PTC041234",
        "udyam_number": "UDYAM-TN-14-0034567",
        "contact_name": "L. Rajendran",
        "contact_designation": "Director",
        "contact_email": "info@maduraispin.example",
        "contact_phone": "+919876534567",
        "workforce_count": 320,
        "exact_turnover_lakhs": 2900,
        "is_mnc": False,
        "tags": [],
    },
    {
        "name": "CBE Auto Components",
        "sector_code": "AUTO",
        "district_code": "CBE",
        "turnover_range_code": "MED_50_100",
        "legal_structure_code": "PVT",
        "business_activity": "manufacturing",
        "address_line1": "Industrial Estate, Avinashi Road",
        "city": "Coimbatore",
        "pincode": "641014",
        "gst_number": "33AACCC9876N1Z3",
        "cin": "U34104TN2007PTC065432",
        "udyam_number": "UDYAM-TN-04-0045678",
        "contact_name": "P. Sundaram",
        "contact_designation": "VP Operations",
        "contact_email": "ops@cbeauto.example",
        "contact_phone": "+919876545678",
        "website": "https://cbeauto.example",
        "workforce_count": 510,
        "exact_turnover_lakhs": 8400,
        "is_mnc": False,
        "tags": ["Defence"],
    },
    {
        "name": "Chennai Aerospace Systems",
        "sector_code": "AERO",
        "district_code": "CHN",
        "taluk_code": "CHN_GUINDY",
        "turnover_range_code": "MED_GT_100",
        "legal_structure_code": "PLC",
        "business_activity": "manufacturing",
        "address_line1": "AS-12, MEPZ Special Economic Zone",
        "city": "Chennai",
        "pincode": "600045",
        "gst_number": "33AAACA1122B1Z4",
        "cin": "L35201TN2002PLC050001",
        "udyam_number": "UDYAM-TN-02-0056789",
        "contact_name": "K. Iyer",
        "contact_designation": "Director",
        "contact_email": "k.iyer@chennaiaero.example",
        "contact_phone": "+919876556789",
        "website": "https://chennaiaero.example",
        "workforce_count": 1240,
        "exact_turnover_lakhs": 12500,
        "is_mnc": False,
        "tags": ["Aerospace", "Defence"],
    },
    {
        "name": "TVS EV Components Pvt Ltd",
        "sector_code": "EV",
        "district_code": "CHN",
        "taluk_code": "CHN_VELACHERY",
        "turnover_range_code": "MED_GT_100",
        "legal_structure_code": "PVT",
        "business_activity": "manufacturing",
        "address_line1": "TVS Tech Park, OMR",
        "city": "Chennai",
        "pincode": "600119",
        "gst_number": "33AAACT4455D1Z6",
        "cin": "U29254TN2018PTC080001",
        "udyam_number": "UDYAM-TN-02-0067890",
        "contact_name": "A. Venkatesan",
        "contact_designation": "Plant Head",
        "contact_email": "plant@tvsev.example",
        "contact_phone": "+919876567890",
        "workforce_count": 680,
        "exact_turnover_lakhs": 14200,
        "is_mnc": False,
        "tags": ["EV"],
    },
    {
        "name": "Tirupur Knitwear Exports",
        "sector_code": "TXT_KNIT",
        "district_code": "TRP",
        "turnover_range_code": "SMALL_5_20",
        "legal_structure_code": "PVT",
        "business_activity": "manufacturing",
        "address_line1": "Mannarai Road",
        "city": "Tiruppur",
        "pincode": "641607",
        "gst_number": "33AAACT9988R1Z9",
        "cin": "U17299TN2012PTC078901",
        "udyam_number": "UDYAM-TN-15-0078901",
        "contact_name": "M. Pandian",
        "contact_designation": "Owner",
        "contact_email": "owner@tirupurkw.example",
        "contact_phone": "+919876578901",
        "workforce_count": 78,
        "exact_turnover_lakhs": 1450,
        "is_mnc": False,
        "tags": ["Export"],
    },
    {
        "name": "Coimbatore Pumps & Motors",
        "sector_code": "ENG_LIGHT",
        "district_code": "CBE",
        "turnover_range_code": "SMALL_20_50",
        "legal_structure_code": "PVT",
        "business_activity": "manufacturing",
        "address_line1": "Peelamedu Industrial Area",
        "city": "Coimbatore",
        "pincode": "641004",
        "gst_number": "33AABCC7766Q1Z1",
        "cin": "U29130TN1995PTC035001",
        "udyam_number": "UDYAM-TN-04-0089012",
        "contact_name": "G. Subramanian",
        "contact_designation": "MD",
        "contact_email": "md@cbepumps.example",
        "contact_phone": "+919876589012",
        "workforce_count": 195,
        "exact_turnover_lakhs": 3850,
        "is_mnc": False,
        "tags": [],
    },
    {
        "name": "Erode Textile Processing",
        "sector_code": "TXT_APP",
        "district_code": "ERD",
        "turnover_range_code": "SMALL_5_20",
        "legal_structure_code": "PART",
        "business_activity": "manufacturing",
        "address_line1": "Perundurai Road",
        "city": "Erode",
        "pincode": "638011",
        "gst_number": "33AAEFT2233E1Z5",
        "udyam_number": "UDYAM-TN-07-0090123",
        "contact_name": "T. Selvaraj",
        "contact_designation": "Partner",
        "contact_email": "selvaraj@erodetex.example",
        "contact_phone": "+919876590123",
        "workforce_count": 64,
        "exact_turnover_lakhs": 980,
        "is_mnc": False,
        "tags": [],
    },
    {
        "name": "Trichy Engineering Works",
        "sector_code": "ENG_HEAVY",
        "district_code": "TRI",
        "turnover_range_code": "MED_50_100",
        "legal_structure_code": "PVT",
        "business_activity": "manufacturing",
        "address_line1": "BHEL Estate, Kailasapuram",
        "city": "Tiruchirappalli",
        "pincode": "620014",
        "gst_number": "33AABCT5544S1Z7",
        "cin": "U29100TN2001PTC047001",
        "udyam_number": "UDYAM-TN-32-0101234",
        "contact_name": "V. Ramanathan",
        "contact_designation": "CEO",
        "contact_email": "ceo@trichyeng.example",
        "contact_phone": "+919876601234",
        "workforce_count": 380,
        "exact_turnover_lakhs": 6700,
        "is_mnc": False,
        "tags": ["Defence"],
    },
    {
        "name": "Hosur Electronics Pvt Ltd",
        "sector_code": "ELC_CONS",
        "district_code": "KRI",
        "turnover_range_code": "MED_50_100",
        "legal_structure_code": "PVT",
        "business_activity": "manufacturing",
        "address_line1": "SIPCOT Phase II, Hosur",
        "city": "Hosur",
        "pincode": "635126",
        "gst_number": "33AABCH7766T1Z8",
        "cin": "U32109TN2010PTC074002",
        "udyam_number": "UDYAM-TN-13-0112345",
        "contact_name": "B. Arun",
        "contact_designation": "Director",
        "contact_email": "arun@hosurelec.example",
        "contact_phone": "+919876612345",
        "workforce_count": 520,
        "exact_turnover_lakhs": 7200,
        "is_mnc": False,
        "tags": [],
    },
    {
        "name": "Sivakasi Fireworks & Paper Co.",
        "sector_code": "PAPR",
        "district_code": "VDN",
        "turnover_range_code": "SMALL_5_20",
        "legal_structure_code": "PROP",
        "business_activity": "manufacturing",
        "address_line1": "Standard Fireworks Road",
        "city": "Sivakasi",
        "pincode": "626123",
        "gst_number": "33AAESS6688V1Z3",
        "udyam_number": "UDYAM-TN-37-0123456",
        "contact_name": "N. Arumugam",
        "contact_designation": "Proprietor",
        "contact_email": "arumugam@sivakasifp.example",
        "contact_phone": "+919876623456",
        "workforce_count": 42,
        "exact_turnover_lakhs": 740,
        "is_mnc": False,
        "tags": [],
    },
    {
        "name": "Tanjore Rice Products",
        "sector_code": "FOOD",
        "district_code": "TJV",
        "turnover_range_code": "MICRO_1_5",
        "legal_structure_code": "PROP",
        "business_activity": "manufacturing",
        "address_line1": "Cauvery Road",
        "city": "Thanjavur",
        "pincode": "613001",
        "gst_number": "33AAETT8899W1Z4",
        "udyam_number": "UDYAM-TN-25-0134567",
        "contact_name": "K. Mahalingam",
        "contact_designation": "Owner",
        "contact_email": "owner@tanjorerice.example",
        "contact_phone": "+919876634567",
        "workforce_count": 18,
        "exact_turnover_lakhs": 320,
        "is_mnc": False,
        "tags": [],
    },
    {
        "name": "Karur Home Textiles",
        "sector_code": "TXT_APP",
        "district_code": "KAR",
        "turnover_range_code": "SMALL_20_50",
        "legal_structure_code": "LLP",
        "business_activity": "manufacturing",
        "address_line1": "Industrial Estate Road",
        "city": "Karur",
        "pincode": "639002",
        "gst_number": "33AABFK1100Y1Z6",
        "udyam_number": "UDYAM-TN-12-0145678",
        "contact_name": "M. Ravichandran",
        "contact_designation": "Designated Partner",
        "contact_email": "ravi@karurhome.example",
        "contact_phone": "+919876645678",
        "workforce_count": 220,
        "exact_turnover_lakhs": 3100,
        "is_mnc": False,
        "tags": ["Export"],
    },
    {
        "name": "Ranipet Leather Tannery",
        "sector_code": "LEAT",
        "district_code": "RNP",
        "turnover_range_code": "SMALL_5_20",
        "legal_structure_code": "PART",
        "business_activity": "manufacturing",
        "address_line1": "SIDCO Leather Complex",
        "city": "Ranipet",
        "pincode": "632403",
        "gst_number": "33AAERR2211Z1Z7",
        "udyam_number": "UDYAM-TN-22-0156789",
        "contact_name": "I. Mohamed",
        "contact_designation": "Partner",
        "contact_email": "i.mohamed@ranipetleather.example",
        "contact_phone": "+919876656789",
        "workforce_count": 98,
        "exact_turnover_lakhs": 1280,
        "is_mnc": False,
        "tags": [],
    },
    {
        "name": "Chengalpattu IT Services",
        "sector_code": "IT",
        "district_code": "CGL",
        "turnover_range_code": "SMALL_5_20",
        "legal_structure_code": "PVT",
        "business_activity": "service",
        "address_line1": "Mahindra World City",
        "city": "Chengalpattu",
        "pincode": "603002",
        "gst_number": "33AAACC4433A1Z9",
        "cin": "U72200TN2015PTC089002",
        "udyam_number": "UDYAM-TN-03-0167890",
        "contact_name": "S. Hari",
        "contact_designation": "Director",
        "contact_email": "hari@cglits.example",
        "contact_phone": "+919876667890",
        "website": "https://cglits.example",
        "workforce_count": 145,
        "exact_turnover_lakhs": 1850,
        "is_mnc": False,
        "tags": [],
    },
    {
        "name": "Kanyakumari Marine Foods",
        "sector_code": "FISH",
        "district_code": "KNY",
        "turnover_range_code": "MICRO_1_5",
        "legal_structure_code": "COOP",
        "business_activity": "manufacturing",
        "address_line1": "Harbour Road, Colachel",
        "city": "Colachel",
        "pincode": "629251",
        "gst_number": "33AAFCK3322B1Z0",
        "udyam_number": "UDYAM-TN-11-0178901",
        "contact_name": "F. Anthony",
        "contact_designation": "Secretary",
        "contact_email": "secretary@kkmf.example",
        "contact_phone": "+919876678901",
        "workforce_count": 32,
        "exact_turnover_lakhs": 410,
        "is_mnc": False,
        "tags": ["Export"],
    },
    {
        "name": "Vellore Pharma Labs",
        "sector_code": "PHAR",
        "district_code": "VLR",
        "turnover_range_code": "MED_50_100",
        "legal_structure_code": "PVT",
        "business_activity": "manufacturing",
        "address_line1": "Katpadi Industrial Area",
        "city": "Vellore",
        "pincode": "632007",
        "gst_number": "33AAACV5566F1Z2",
        "cin": "U24232TN2004PTC053001",
        "udyam_number": "UDYAM-TN-35-0189012",
        "contact_name": "R. Saravanan",
        "contact_designation": "QC Head",
        "contact_email": "saravanan@vellorepharma.example",
        "contact_phone": "+919876689012",
        "workforce_count": 295,
        "exact_turnover_lakhs": 5400,
        "is_mnc": False,
        "tags": [],
    },
    {
        "name": "Dharmapuri Granite Exports",
        "sector_code": "CONS",
        "district_code": "DHR",
        "turnover_range_code": "SMALL_5_20",
        "legal_structure_code": "PVT",
        "business_activity": "manufacturing",
        "address_line1": "Bangalore Highway",
        "city": "Dharmapuri",
        "pincode": "636701",
        "gst_number": "33AAACD7788H1Z3",
        "udyam_number": "UDYAM-TN-06-0190123",
        "contact_name": "C. Balaji",
        "contact_designation": "Director",
        "contact_email": "balaji@dhrgranite.example",
        "contact_phone": "+919876690123",
        "workforce_count": 56,
        "exact_turnover_lakhs": 920,
        "is_mnc": False,
        "tags": ["Export"],
    },
    {
        "name": "Nilgiris Tea Processors",
        "sector_code": "AGRO",
        "district_code": "NLG",
        "turnover_range_code": "MICRO_1_5",
        "legal_structure_code": "PVT",
        "business_activity": "manufacturing",
        "address_line1": "Coonoor Estate",
        "city": "Coonoor",
        "pincode": "643102",
        "gst_number": "33AAACN9900J1Z4",
        "cin": "U15491TN1992PTC025001",
        "udyam_number": "UDYAM-TN-17-0201234",
        "contact_name": "L. Easwaramoorthy",
        "contact_designation": "MD",
        "contact_email": "md@nilgiristea.example",
        "contact_phone": "+919876701234",
        "workforce_count": 24,
        "exact_turnover_lakhs": 380,
        "is_mnc": False,
        "tags": ["Export"],
    },
    {
        "name": "Tiruvallur Plastics Pvt Ltd",
        "sector_code": "PLAS",
        "district_code": "TVR",
        "turnover_range_code": "SMALL_20_50",
        "legal_structure_code": "PVT",
        "business_activity": "manufacturing",
        "address_line1": "Gummidipoondi SIPCOT",
        "city": "Tiruvallur",
        "pincode": "601201",
        "gst_number": "33AABCT1212K1Z5",
        "cin": "U25209TN2008PTC069001",
        "udyam_number": "UDYAM-TN-31-0212345",
        "contact_name": "D. Suresh",
        "contact_designation": "GM",
        "contact_email": "suresh@tvrplastics.example",
        "contact_phone": "+919876712345",
        "workforce_count": 180,
        "exact_turnover_lakhs": 2400,
        "is_mnc": False,
        "tags": [],
    },
    {
        "name": "Theni Spices Industries",
        "sector_code": "AGRO",
        "district_code": "THI",
        "turnover_range_code": "MICRO_LT_1",
        "legal_structure_code": "PROP",
        "business_activity": "manufacturing",
        "address_line1": "Bodi Road",
        "city": "Theni",
        "pincode": "625531",
        "gst_number": "33AAETT3434L1Z6",
        "udyam_number": "UDYAM-TN-27-0223456",
        "contact_name": "P. Karthik",
        "contact_designation": "Owner",
        "contact_email": "karthik@thenispice.example",
        "contact_phone": "+919876723456",
        "workforce_count": 12,
        "exact_turnover_lakhs": 85,
        "is_mnc": False,
        "tags": [],
    },
    {
        "name": "Madurai Medical Devices",
        "sector_code": "MEDI",
        "district_code": "MDU",
        "turnover_range_code": "MED_50_100",
        "legal_structure_code": "PVT",
        "business_activity": "manufacturing",
        "address_line1": "TIDEL Park, Madurai",
        "city": "Madurai",
        "pincode": "625001",
        "gst_number": "33AAACM5656M1Z7",
        "cin": "U33112TN2016PTC094001",
        "udyam_number": "UDYAM-TN-14-0234567",
        "contact_name": "J. Ramesh",
        "contact_designation": "CTO",
        "contact_email": "ramesh@maduraimed.example",
        "contact_phone": "+919876734567",
        "workforce_count": 340,
        "exact_turnover_lakhs": 6100,
        "is_mnc": False,
        "tags": ["Defence"],
    },
    {
        "name": "Tiruppur Garment Hub",
        "sector_code": "TXT_KNIT",
        "district_code": "TRP",
        "turnover_range_code": "MED_50_100",
        "legal_structure_code": "PVT",
        "business_activity": "manufacturing",
        "address_line1": "Mudalipalayam Road",
        "city": "Tiruppur",
        "pincode": "641606",
        "gst_number": "33AABCG7878N1Z8",
        "cin": "U17299TN2014PTC086001",
        "udyam_number": "UDYAM-TN-15-0245678",
        "contact_name": "S. Govindarajan",
        "contact_designation": "MD",
        "contact_email": "md@tirupurgh.example",
        "contact_phone": "+919876745678",
        "website": "https://tirupurgh.example",
        "workforce_count": 920,
        "exact_turnover_lakhs": 9500,
        "is_mnc": False,
        "tags": ["Export"],
    },
    {
        "name": "Coimbatore Foundry Co.",
        "sector_code": "FORG", 
        "district_code": "CBE",
        "turnover_range_code": "SMALL_20_50",
        "legal_structure_code": "PVT",
        "business_activity": "manufacturing",
        "address_line1": "Singanallur Industrial Estate",
        "city": "Coimbatore",
        "pincode": "641005",
        "gst_number": "33AABCC8989P1Z9",
        "cin": "U27101TN2003PTC051001",
        "udyam_number": "UDYAM-TN-04-0256789",
        "contact_name": "K. Manikandan",
        "contact_designation": "Director",
        "contact_email": "mani@cbefoundry.example",
        "contact_phone": "+919876756789",
        "workforce_count": 165,
        "exact_turnover_lakhs": 2750,
        "is_mnc": False,
        "tags": ["Forging"],
    },
]


# ---------------------------------------------------------------------------
# Bulk deterministic generator
# ---------------------------------------------------------------------------
# Everything below produces additional companies programmatically. Master codes
# (district / sector / turnover / legal-structure) all come from master_seed.py,
# so the generated rows stay consistent with the master tables. Generation is
# seeded, so the same dataset is produced on every run (names are deduped against
# the curated list above, so re-seeding is idempotent via seed.py's name check).

# code -> (city, [pincodes], udyam_region_code)
_DISTRICTS: dict[str, tuple[str, list[str], str]] = {
    "ARI": ("Ariyalur", ["621704", "621713", "621730"], "01"),
    "CHN": ("Chennai", ["600001", "600032", "600045", "600058", "600095", "600119"], "02"),
    "CGL": ("Chengalpattu", ["603001", "603002", "603204", "603210"], "03"),
    "CBE": ("Coimbatore", ["641001", "641004", "641005", "641014", "641021", "641062"], "04"),
    "CDL": ("Cuddalore", ["607001", "607002", "607106", "608601"], "05"),
    "DHR": ("Dharmapuri", ["636701", "636705", "636809"], "06"),
    "DDG": ("Dindigul", ["624001", "624005", "624219", "624301"], "08"),
    "ERD": ("Erode", ["638001", "638011", "638052", "638154"], "07"),
    "KLK": ("Kallakurichi", ["606202", "606213", "606301"], "09"),
    "KAN": ("Kanchipuram", ["631501", "631502", "631551", "603308"], "10"),
    "KNY": ("Nagercoil", ["629001", "629003", "629251", "629701"], "11"),
    "KAR": ("Karur", ["639001", "639002", "639003", "639006"], "12"),
    "KRI": ("Hosur", ["635001", "635109", "635126", "635110"], "13"),
    "MDU": ("Madurai", ["625001", "625009", "625014", "625019", "625020"], "14"),
    "MYL": ("Mayiladuthurai", ["609001", "609101", "609204"], "16"),
    "NAG": ("Nagapattinam", ["611001", "611002", "611108", "614809"], "18"),
    "NMK": ("Namakkal", ["637001", "637003", "637018", "638183"], "19"),
    "NLG": ("Ooty", ["643001", "643102", "643103", "643201"], "17"),
    "PMB": ("Perambalur", ["621212", "621104", "621220"], "20"),
    "PDK": ("Pudukkottai", ["622001", "622003", "622303", "622505"], "21"),
    "RMD": ("Ramanathapuram", ["623501", "623503", "623701", "623806"], "24"),
    "RNP": ("Ranipet", ["632401", "632403", "632404", "632509"], "22"),
    "SLM": ("Salem", ["636001", "636004", "636007", "636302", "636309"], "23"),
    "SVG": ("Sivaganga", ["630561", "630562", "630606", "623806"], "26"),
    "TJV": ("Thanjavur", ["613001", "613004", "613005", "614001"], "25"),
    "THI": ("Theni", ["625531", "625512", "625534", "625579"], "27"),
    "THV": ("Thoothukudi", ["628001", "628002", "628008", "628151"], "28"),
    "TKS": ("Tenkasi", ["627811", "627751", "627808", "627953"], "29"),
    "TVL": ("Tirunelveli", ["627001", "627002", "627005", "627007"], "30"),
    "TPT": ("Tirupathur", ["635601", "635602", "635653", "635901"], "33"),
    "TRP": ("Tiruppur", ["641601", "641603", "641604", "641606", "641607"], "15"),
    "TVR": ("Tiruvallur", ["602001", "601201", "601202", "600062"], "31"),
    "TVM": ("Tiruvannamalai", ["606601", "606603", "606604", "606803"], "34"),
    "TVA": ("Tiruvarur", ["610001", "610101", "610204", "614701"], "36"),
    "TRI": ("Tiruchirappalli", ["620001", "620008", "620014", "620018"], "32"),
    "VLR": ("Vellore", ["632001", "632004", "632007", "632009"], "35"),
    "VLP": ("Viluppuram", ["605602", "605401", "605701", "604001"], "38"),
    "VDN": ("Virudhunagar", ["626001", "626002", "626123", "626189"], "37"),
}

# sector -> (name nouns, business_activity, cin_nic_5digit, likely_tags)
_SECTORS: dict[str, tuple[list[str], str, str, list[str]]] = {
    "TXT_APP": (["Textiles", "Apparels", "Garments", "Fabrics", "Spinning Mills", "Clothing"], "manufacturing", "17111", ["Export"]),
    "TXT_KNIT": (["Knitwear", "Hosiery", "Knit Fabrics", "Knit Garments", "Knitting Mills"], "manufacturing", "17299", ["Export"]),
    "TXT_TECH": (["Technical Textiles", "Nonwovens", "Industrial Fabrics", "Geotextiles"], "manufacturing", "13921", ["Export"]),
    "LEAT": (["Leathers", "Tanneries", "Footwear", "Leather Goods", "Shoe Works"], "manufacturing", "15129", ["Export"]),
    "AUTO": (["Auto Components", "Auto Parts", "Automotive Systems", "Motor Components"], "manufacturing", "29301", ["Defence"]),
    "AERO": (["Aerospace", "Aero Systems", "Defence Systems", "Aero Components"], "manufacturing", "35304", ["Aerospace", "Defence"]),
    "EV": (["EV Components", "Electric Mobility", "EV Systems", "E-Mobility"], "manufacturing", "29304", ["EV"]),
    "ENG_HEAVY": (["Heavy Engineering", "Engineering Works", "Fabrication Works", "Structurals"], "manufacturing", "29100", ["Defence"]),
    "ENG_LIGHT": (["Engineering", "Precision Engineering", "Pumps & Motors", "Tools"], "manufacturing", "29130", []),
    "FORG": (["Forgings", "Foundry", "Castings", "Forge Industries"], "manufacturing", "27310", ["Forging"]),
    "MACH": (["Machinery", "Machine Tools", "Equipment", "Industrial Machines"], "manufacturing", "29200", []),
    "ELEC": (["Electricals", "Electrical Systems", "Switchgear", "Transformers"], "manufacturing", "31100", []),
    "ELC_PWR": (["Power Electronics", "Power Systems", "Inverters", "Drives"], "manufacturing", "27900", ["EV"]),
    "ELC_CONS": (["Electronics", "Consumer Electronics", "Appliances", "Devices"], "manufacturing", "32109", []),
    "SEMI": (["Semiconductors", "Microelectronics", "Semicon", "Chip Systems"], "manufacturing", "32100", []),
    "IT": (["Technologies", "Software", "IT Solutions", "Systems", "Infotech"], "service", "72200", []),
    "ITES": (["BPO Services", "Business Services", "Data Solutions", "Outsourcing"], "service", "74999", []),
    "FOOD": (["Foods", "Food Products", "Food Industries", "Agro Foods"], "manufacturing", "15490", ["Export"]),
    "BEV": (["Beverages", "Drinks", "Aerated Waters", "Juices"], "manufacturing", "15543", []),
    "AGRO": (["Agro", "Agro Industries", "Agri Products", "Agro Processing"], "manufacturing", "15499", ["Export"]),
    "DAIRY": (["Dairy", "Milk Products", "Creameries", "Dairy Foods"], "manufacturing", "15202", []),
    "FISH": (["Marine Foods", "Seafoods", "Fisheries", "Marine Exports"], "manufacturing", "15120", ["Export"]),
    "PHAR": (["Pharma", "Pharmaceuticals", "Labs", "Lifesciences"], "manufacturing", "24232", []),
    "BIOT": (["Biotech", "Biosciences", "Bio Labs", "Life Sciences"], "manufacturing", "73100", []),
    "MEDI": (["Medical Devices", "Meditech", "Healthcare Devices", "Surgicals"], "manufacturing", "33110", ["Defence"]),
    "CHEM": (["Chemicals", "Chemical Industries", "Speciality Chemicals", "Chem Works"], "manufacturing", "24114", []),
    "PETR": (["Petrochemicals", "Polymers", "Petro Products"], "manufacturing", "23201", []),
    "PLAS": (["Plastics", "Polymers", "Plastic Products", "Moulders"], "manufacturing", "25209", []),
    "RUBR": (["Rubbers", "Rubber Products", "Rubber Industries", "Elastomers"], "manufacturing", "25190", []),
    "PACK": (["Packaging", "Packs", "Packaging Industries", "Flexipack"], "manufacturing", "21029", ["Export"]),
    "PAPR": (["Paper Mills", "Papers", "Pulp & Paper", "Paper Products"], "manufacturing", "21012", []),
    "PRNT": (["Printers", "Printing Works", "Offset Printers", "Graphics"], "manufacturing", "22219", []),
    "FURN": (["Furniture", "Woodworks", "Furnishings", "Wood Industries"], "manufacturing", "36101", []),
    "CONS": (["Constructions", "Build Materials", "Granites", "Blue Metals"], "manufacturing", "26959", ["Export"]),
    "CEMT": (["Cements", "Cement Works", "Concrete Products"], "manufacturing", "26942", []),
    "STEEL": (["Steels", "Iron & Steel", "Steel Industries", "Alloys"], "manufacturing", "27100", []),
}

# Weighted district pool (industrial belts appear more often).
_DISTRICT_WEIGHTS: dict[str, int] = {
    "CBE": 14, "CHN": 14, "TRP": 11, "MDU": 8, "SLM": 8, "ERD": 7, "TRI": 6,
    "KRI": 6, "TVR": 5, "KAN": 5, "CGL": 5, "VLR": 4, "KAR": 4, "NMK": 4,
    "DDG": 3, "THV": 3, "TVL": 3, "VDN": 3, "RNP": 3, "TJV": 2, "CDL": 2,
    "DHR": 2, "VLP": 2, "PDK": 2, "THI": 2, "NLG": 2, "TVM": 2, "SVG": 1,
    "RMD": 1, "TKS": 1, "TPT": 1, "KNY": 1, "NAG": 1, "MYL": 1, "TVA": 1,
    "ARI": 1, "PMB": 1, "KLK": 1,
}

_SECTOR_WEIGHTS: dict[str, int] = {
    "TXT_APP": 10, "TXT_KNIT": 10, "AUTO": 8, "ENG_LIGHT": 8, "FOOD": 7,
    "ENG_HEAVY": 5, "FORG": 5, "PLAS": 5, "MACH": 4, "ELEC": 4, "AGRO": 4,
    "CHEM": 4, "LEAT": 4, "ELC_CONS": 3, "PACK": 3, "PHAR": 3, "PRNT": 3,
    "FURN": 3, "RUBR": 3, "CONS": 3, "TXT_TECH": 2, "EV": 2, "ELC_PWR": 2,
    "MEDI": 2, "DAIRY": 2, "FISH": 2, "BEV": 2, "PAPR": 2, "STEEL": 2,
    "IT": 2, "ITES": 2, "AERO": 1, "SEMI": 1, "BIOT": 1, "PETR": 1, "CEMT": 1,
}

_TURNOVER_WEIGHTS: dict[str, int] = {
    "MICRO_LT_1": 14, "MICRO_1_5": 22, "SMALL_5_20": 26,
    "SMALL_20_50": 20, "MED_50_100": 12, "MED_GT_100": 6,
}

# turnover_code -> (turnover_lakhs_range, workforce_range)
_TURNOVER_PROFILE: dict[str, tuple[tuple[int, int], tuple[int, int]]] = {
    "MICRO_LT_1": ((15, 95), (4, 18)),
    "MICRO_1_5": ((110, 480), (15, 55)),
    "SMALL_5_20": ((520, 1950), (45, 140)),
    "SMALL_20_50": ((2100, 4900), (110, 340)),
    "MED_50_100": ((5100, 9900), (260, 690)),
    "MED_GT_100": ((10200, 28000), (520, 2400)),
}

_LEGAL_WEIGHTS: dict[str, int] = {
    "PVT": 34, "PROP": 22, "PART": 14, "LLP": 10, "OPC": 8,
    "PLC": 5, "COOP": 4, "SHG": 3,
}

# legal_code -> (name suffixes, designations, pan_entity_char, cin_type|None)
_LEGAL_PROFILE: dict[str, tuple[list[str], list[str], str, str | None]] = {
    "PVT": (["Pvt Ltd", "Private Limited", "India Pvt Ltd"], ["Managing Director", "Director", "CEO", "General Manager", "VP Operations", "Plant Head"], "C", "PTC"),
    "PLC": (["Ltd", "Limited", "Industries Ltd"], ["Director", "CEO", "Managing Director", "Executive Director"], "C", "PLC"),
    "OPC": (["(OPC) Pvt Ltd", "(OPC) Private Limited"], ["Director", "Managing Director", "Founder"], "C", "PTC"),
    "LLP": (["LLP"], ["Designated Partner", "Partner", "Managing Partner"], "F", None),
    "PART": (["& Co", "& Sons", "& Brothers", "Enterprises"], ["Partner", "Managing Partner"], "F", None),
    "PROP": (["Enterprises", "Industries", "Traders", "& Co"], ["Proprietor", "Owner"], "P", None),
    "COOP": (["Cooperative Society", "Co-op Industries"], ["Secretary", "President"], "A", None),
    "SHG": (["Self Help Group", "Mahalir Industries"], ["President", "Secretary"], "A", None),
}

_PREFIXES: list[str] = [
    "Sri", "Sree", "Annai", "Bharath", "Kongu", "Tamil", "Vetri", "Jai", "Sakthi",
    "Sri Sakthi", "Aadhi", "Arul", "Pioneer", "Premier", "Universal", "National",
    "Lakshmi", "Murugan", "Velan", "Amman", "Selva", "Karpaga", "Vel", "Sunrise",
    "Sundaram", "Sri Balaji", "Kovai", "Madura", "Pandian", "Cauvery", "Vaigai",
    "Thamarai", "Vishnu", "Star", "Royal", "Global", "Metro", "Crown", "Apex",
    "Zenith", "Elite", "Prime", "Orient", "Eastern", "Southern", "Bharani",
    "Saravana", "Gokul", "Sri Vari", "Anand", "Sri Devi", "Kamatchi", "Velavan",
]

_FIRST_INITIALS = list("RSKMPVATNGDJLBC")
_NAMES: list[str] = [
    "Kumar", "Murugan", "Anand", "Selvam", "Raja", "Senthil", "Bose", "Ganesh",
    "Prakash", "Mohan", "Ravi", "Karthik", "Suresh", "Vimal", "Sekar", "Lakshmi",
    "Priya", "Kavitha", "Deepa", "Anitha", "Saranya", "Rajendran", "Sundaram",
    "Balaji", "Manikandan", "Pandian", "Govindaraj", "Arumugam", "Subramanian",
    "Ramesh", "Venkatesh", "Saravanan", "Hari", "Arun", "Vijay", "Dinesh",
    "Sathish", "Gopal", "Nandakumar", "Chandran", "Easwaran", "Mahalingam",
    "Thangavel", "Velmurugan", "Iyappan", "Rajkumar", "Shanmugam", "Nataraj",
]

_AREAS: list[str] = [
    "SIDCO Industrial Estate", "SIPCOT Industrial Complex", "SIPCOT Phase I",
    "SIPCOT Phase II", "Industrial Estate", "Industrial Growth Centre",
    "Small Industries Area", "Industrial Park", "Manufacturers Colony",
    "Industrial Area", "MSME Industrial Estate", "Export Promotion Zone",
]

_EMAIL_LOCALS = ["info", "contact", "md", "ceo", "sales", "mail", "office"]


def _slug(name: str) -> str:
    cleaned = []
    for ch in name.lower():
        if ch.isalnum():
            cleaned.append(ch)
        elif ch == " " and cleaned and cleaned[-1] != "-":
            cleaned.append("-")
    slug = "".join(cleaned).strip("-")
    return slug[:24] or "company"


def _weighted_choice(rng: "_random.Random", weights: dict[str, int]) -> str:
    keys = list(weights.keys())
    return rng.choices(keys, weights=[weights[k] for k in keys], k=1)[0]


def _gen_pan(rng: "_random.Random", entity_char: str, surname_char: str) -> str:
    letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    head = "".join(rng.choice(letters) for _ in range(3))
    digits = f"{rng.randint(0, 9999):04d}"
    return f"{head}{entity_char}{surname_char}{digits}{rng.choice(letters)}"


def _generate_companies(count: int, existing_names: set[str]) -> list[dict]:
    rng = _random.Random(20240529)
    rows: list[dict] = []
    used = set(existing_names)
    serial = 0

    while len(rows) < count:
        district_code = _weighted_choice(rng, _DISTRICT_WEIGHTS)
        sector_code = _weighted_choice(rng, _SECTOR_WEIGHTS)
        turnover_code = _weighted_choice(rng, _TURNOVER_WEIGHTS)
        legal_code = _weighted_choice(rng, _LEGAL_WEIGHTS)

        city, pincodes, udyam_region = _DISTRICTS[district_code]
        nouns, activity, nic, likely_tags = _SECTORS[sector_code]
        suffixes, designations, pan_entity, cin_type = _LEGAL_PROFILE[legal_code]

        noun = rng.choice(nouns)
        suffix = rng.choice(suffixes)

        # Build a unique name; retry with an extra prefix word if it collides.
        name = None
        for _ in range(8):
            prefix = rng.choice(_PREFIXES)
            candidate = f"{prefix} {noun} {suffix}".strip()
            if candidate not in used:
                name = candidate
                break
        if name is None:
            name = f"{rng.choice(_PREFIXES)} {city} {noun} {suffix}".strip()
            if name in used:
                continue
        used.add(name)

        (lo_t, hi_t), (lo_w, hi_w) = _TURNOVER_PROFILE[turnover_code]
        turnover_lakhs = rng.randint(lo_t, hi_t)
        workforce = rng.randint(lo_w, hi_w)

        contact_first = rng.choice(_FIRST_INITIALS)
        contact_surname = rng.choice(_NAMES)
        contact_name = f"{contact_first}. {contact_surname}"
        designation = rng.choice(designations)

        slug = _slug(f"{name.split(' ')[0]}{noun}")
        email = f"{rng.choice(_EMAIL_LOCALS)}@{slug}.example"

        pan = _gen_pan(rng, pan_entity, contact_surname[0].upper())
        gst_number = f"33{pan}{rng.randint(1, 9)}Z{rng.randint(0, 9)}"

        cin = None
        if cin_type:
            year = rng.randint(1990, 2022)
            cin = f"U{nic}TN{year}{cin_type}{rng.randint(10000, 999999):06d}"

        serial += 1
        udyam_number = f"UDYAM-TN-{udyam_region}-{serial + 300000:07d}"
        phone = f"+91{9000000000 + serial}"

        tags: list[str] = []
        for tag in likely_tags:
            if rng.random() < 0.5:
                tags.append(tag)
        if turnover_code in ("MED_50_100", "MED_GT_100") and rng.random() < 0.3 and "Defence" not in tags:
            tags.append("Defence")
        if rng.random() < 0.2 and "Green" not in tags:
            tags.append("Green")

        website = None
        if activity == "service" or turnover_code in ("MED_50_100", "MED_GT_100") or rng.random() < 0.3:
            website = f"https://{slug}.example"

        plot = f"{rng.randint(1, 220)}{rng.choice(['', '/A', '/B', '/C', '-1', '-2'])}"
        address = f"Plot {plot}, {rng.choice(_AREAS)}"

        row: dict = {
            "name": name,
            "sector_code": sector_code,
            "district_code": district_code,
            "turnover_range_code": turnover_code,
            "legal_structure_code": legal_code,
            "business_activity": activity,
            "address_line1": address,
            "city": city,
            "pincode": rng.choice(pincodes),
            "gst_number": gst_number,
            "udyam_number": udyam_number,
            "pan": pan,
            "contact_name": contact_name,
            "contact_designation": designation,
            "contact_email": email,
            "contact_phone": phone,
            "workforce_count": workforce,
            "exact_turnover_lakhs": turnover_lakhs,
            "is_mnc": rng.random() < 0.04,
            "tags": tags,
        }
        if cin:
            row["cin"] = cin
        if website:
            row["website"] = website

        rows.append(row)

    return rows


COMPANIES.extend(_generate_companies(525, {c["name"] for c in COMPANIES}))
