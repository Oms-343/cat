from datetime import date
from sqlmodel import Session, select
from app.core.security import hash_password
from app.data.company_seed import COMPANIES
from app.data.master_seed import SEED_BY_KEY
from app.data.taluk_pincode_seed import HSN_SAMPLE, PINCODES, TALUKS
from app.models.master import HSNCodeMaster, PincodeMaster, TalukMaster
from app.database import engine, init_db
from app.models.company import Company
from app.models.company_subitem import (
    CompanyCertification,
    CompanyCustomer,
    CompanyMachinery,
    CompanyProduct,
    CustomerType,
)
from app.models.master import MASTERS
from app.models.user import User, UserRole

DUMMY_USERS = [
    {
        "email": "super@tidco.com",
        "full_name": "Murugesan",
        "designation": "Senior Officer",
        "mobile": "+919000000001",
        "role": UserRole.SUPER,
        "password": "super123",
    },
    {
        "email": "admin@tidco.com",
        "full_name": "Priya",
        "designation": "Operations Staff",
        "mobile": "+919000000002",
        "role": UserRole.ADMIN,
        "password": "admin123",
    },
    {
        "email": "msme@example.com",
        "full_name": "Vignesh Kumar",
        "designation": "Owner",
        "mobile": "+919000000003",
        "role": UserRole.MSME,
        "password": "msme123",
    },
]


def seed_users() -> None:
    with Session(engine) as session:
        created = 0
        for u in DUMMY_USERS:
            existing = session.exec(select(User).where(User.email == u["email"])).first()
            if existing:
                continue
            session.add(
                User(
                    email=u["email"],
                    full_name=u["full_name"],
                    designation=u["designation"],
                    mobile=u["mobile"],
                    role=u["role"],
                    hashed_password=hash_password(u["password"]),
                )
            )
            created += 1
        session.commit()
    print(f"Users: {created} new, {len(DUMMY_USERS) - created} already existed.")
    for u in DUMMY_USERS:
        print(f"  [{u['role'].value:5s}] {u['email']:25s}  password: {u['password']}")


def seed_masters() -> None:
    with Session(engine) as session:
        for key, entries in SEED_BY_KEY.items():
            model = MASTERS[key]["model"]
            created = 0
            for idx, (code, name, description) in enumerate(entries):
                existing = session.exec(select(model).where(model.code == code)).first()
                if existing:
                    continue
                session.add(
                    model(
                        code=code,
                        name=name,
                        description=description,
                        is_active=True,
                        sort_order=idx,
                    )
                )
                created += 1
            session.commit()
            print(f"Master '{key}': {created} new, {len(entries) - created} already existed.")


def seed_taluks_pincodes_hsn() -> None:
    with Session(engine) as session:
        for idx, (code, name, district_code) in enumerate(TALUKS):
            if session.exec(select(TalukMaster).where(TalukMaster.code == code)).first():
                continue
            session.add(
                TalukMaster(
                    code=code,
                    name=name,
                    district_code=district_code,
                    is_active=True,
                    sort_order=idx,
                )
            )
        for idx, (code, name, district_code, taluk_code) in enumerate(PINCODES):
            if session.exec(select(PincodeMaster).where(PincodeMaster.code == code)).first():
                continue
            session.add(
                PincodeMaster(
                    code=code,
                    name=name,
                    district_code=district_code,
                    taluk_code=taluk_code,
                    is_active=True,
                    sort_order=idx,
                )
            )
        for idx, (code, name, description) in enumerate(HSN_SAMPLE):
            if session.exec(select(HSNCodeMaster).where(HSNCodeMaster.code == code)).first():
                continue
            session.add(
                HSNCodeMaster(
                    code=code,
                    name=name,
                    description=description,
                    is_active=True,
                    sort_order=idx,
                )
            )
        session.commit()
    print("Taluks, sample pincodes, and HSN codes seeded.")


def seed_companies() -> None:
    with Session(engine) as session:
        created = 0
        skipped = 0
        for c in COMPANIES:
            existing = session.exec(select(Company).where(Company.name == c["name"])).first()
            if existing:
                skipped += 1
                continue
            session.add(Company(**c))
            created += 1
        session.commit()
        print(f"Companies: {created} new, {skipped} already existed.")


def seed_subitems() -> None:
    """Populate sections 3-6 for two showcase companies so the UI has live data."""
    with Session(engine) as session:
        velocity = session.exec(
            select(Company).where(Company.name == "Velocity Knit Industries")
        ).first()
        salem = session.exec(
            select(Company).where(Company.name == "Salem Steel Forgings")
        ).first()
        if not velocity or not salem:
            print("Subitems: skipping — showcase companies not present.")
            return

        def add_if_empty(model, items):
            existing = session.exec(
                select(model.id).where(model.company_id == items[0].company_id).limit(1)
            ).first()
            if existing:
                return 0
            for it in items:
                session.add(it)
            return len(items)

        velocity_added = 0
        velocity_added += add_if_empty(
            CompanyProduct,
            [
                CompanyProduct(
                    company_id=velocity.id, name="Cotton T-Shirts",
                    description="Ring-spun combed cotton, 180 GSM",
                    hsn_code="6109", tags=["Cotton", "Knitted", "Export-grade"],
                    sort_order=0,
                ),
                CompanyProduct(
                    company_id=velocity.id, name="Polo Shirts",
                    description="Pique knit polo shirts with embroidered logo",
                    hsn_code="6105", tags=["Cotton", "Knitted"],
                    sort_order=1,
                ),
                CompanyProduct(
                    company_id=velocity.id, name="Sweatshirts",
                    description="Fleece-lined pullover sweatshirts",
                    hsn_code="6110", tags=["Fleece", "Winter-wear"],
                    sort_order=2,
                ),
            ],
        )
        velocity_added += add_if_empty(
            CompanyCertification,
            [
                CompanyCertification(
                    company_id=velocity.id, certification_code="ISO9001",
                    certificate_number="IN-9001-2023-VK1845",
                    issued_date=date(2023, 4, 15),
                    expiry_date=date(2026, 4, 14),
                    issuer="BSI Group India",
                ),
                CompanyCertification(
                    company_id=velocity.id, certification_code="OEKO_TEX",
                    certificate_number="OEKO-2024-IN-7821",
                    issued_date=date(2024, 1, 10),
                    expiry_date=date(2025, 12, 31),
                    issuer="OEKO-TEX Association",
                ),
                CompanyCertification(
                    company_id=velocity.id, certification_code="GOTS",
                    certificate_number="GOTS-IN-2024-3401",
                    issued_date=date(2024, 6, 1),
                    expiry_date=date(2025, 5, 31),
                    issuer="Control Union India",
                ),
            ],
        )
        velocity_added += add_if_empty(
            CompanyCustomer,
            [
                CompanyCustomer(
                    company_id=velocity.id, name="H&M Group",
                    customer_type=CustomerType.EXPORT, country="Sweden",
                    relationship_years=6,
                ),
                CompanyCustomer(
                    company_id=velocity.id, name="Marks & Spencer",
                    customer_type=CustomerType.EXPORT, country="United Kingdom",
                    relationship_years=4,
                ),
                CompanyCustomer(
                    company_id=velocity.id, name="Reliance Trends",
                    customer_type=CustomerType.BUSINESS, country="India",
                    relationship_years=2,
                ),
            ],
        )
        velocity_added += add_if_empty(
            CompanyMachinery,
            [
                CompanyMachinery(
                    company_id=velocity.id, name="Circular Knitting Machines",
                    quantity=18, capacity_value=850, capacity_unit="KG",
                    description="Mayer & Cie MV4 single jersey machines",
                    sort_order=0,
                ),
                CompanyMachinery(
                    company_id=velocity.id, name="Computerised Flatbed Knitting",
                    quantity=6, capacity_value=200, capacity_unit="KG",
                    description="Shima Seiki SSG 122 series",
                    sort_order=1,
                ),
                CompanyMachinery(
                    company_id=velocity.id, name="Automatic Cutting Tables",
                    quantity=4, capacity_value=12000, capacity_unit="PCS",
                    description="Gerber GTxL cutting system",
                    sort_order=2,
                ),
            ],
        )
        print(f"Velocity Knit subitems: +{velocity_added}")

        salem_added = 0
        salem_added += add_if_empty(
            CompanyProduct,
            [
                CompanyProduct(
                    company_id=salem.id, name="Crankshafts",
                    description="Forged steel crankshafts for diesel engines",
                    hsn_code="8483", tags=["Forged", "Defence", "Heavy-vehicle"],
                    sort_order=0,
                ),
                CompanyProduct(
                    company_id=salem.id, name="Connecting Rods",
                    description="High-strength I-beam connecting rods",
                    hsn_code="8483", tags=["Forged", "Auto"],
                    sort_order=1,
                ),
            ],
        )
        salem_added += add_if_empty(
            CompanyCertification,
            [
                CompanyCertification(
                    company_id=salem.id, certification_code="ISO9001",
                    certificate_number="IN-9001-2022-SSF992",
                    issued_date=date(2022, 9, 1),
                    expiry_date=date(2025, 8, 31),
                    issuer="TÜV Rheinland India",
                ),
                CompanyCertification(
                    company_id=salem.id, certification_code="IATF16949",
                    certificate_number="IATF-IN-2023-1184",
                    issued_date=date(2023, 3, 15),
                    expiry_date=date(2026, 3, 14),
                    issuer="DNV India",
                ),
                CompanyCertification(
                    company_id=salem.id, certification_code="AS9100",
                    certificate_number="AS9100D-IN-2024-501",
                    issued_date=date(2024, 2, 20),
                    expiry_date=date(2027, 2, 19),
                    issuer="BSI Group India",
                    notes="Aerospace-grade — required for HAL supply contract",
                ),
            ],
        )
        salem_added += add_if_empty(
            CompanyCustomer,
            [
                CompanyCustomer(
                    company_id=salem.id, name="Hindustan Aeronautics Limited (HAL)",
                    customer_type=CustomerType.GOVERNMENT, country="India",
                    relationship_years=8,
                ),
                CompanyCustomer(
                    company_id=salem.id, name="Tata Motors",
                    customer_type=CustomerType.BUSINESS, country="India",
                    relationship_years=12,
                ),
                CompanyCustomer(
                    company_id=salem.id, name="Ashok Leyland",
                    customer_type=CustomerType.BUSINESS, country="India",
                    relationship_years=10,
                ),
            ],
        )
        salem_added += add_if_empty(
            CompanyMachinery,
            [
                CompanyMachinery(
                    company_id=salem.id, name="Closed-die Forging Press 2500 ton",
                    quantity=2, capacity_value=2500, capacity_unit="TON",
                    description="Schuler MP-2500 hot forging press",
                ),
                CompanyMachinery(
                    company_id=salem.id, name="Induction Heating Furnaces",
                    quantity=4, capacity_value=1.2, capacity_unit="TON",
                    description="ABP Induction 1.2 MW units",
                ),
                CompanyMachinery(
                    company_id=salem.id, name="CNC Machining Centres",
                    quantity=12, capacity_value=0, capacity_unit="UNIT",
                    description="DMG MORI NHX series 5-axis",
                ),
            ],
        )
        print(f"Salem Steel Forgings subitems: +{salem_added}")

        session.commit()


def main() -> None:
    init_db()
    seed_users()
    seed_masters()
    seed_taluks_pincodes_hsn()
    seed_companies()
    seed_subitems()


if __name__ == "__main__":
    main()
