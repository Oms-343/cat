from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import audit as audit_router
from app.api import auth as auth_router
from app.api import companies as companies_router
from app.api import company_subitems as company_subitems_router
from app.api import dashboard as dashboard_router
from app.api import masters as masters_router
from app.api import edit_requests as edit_requests_router
from app.api import reports as reports_router
from app.api import uploads as uploads_router
from app.api import users as users_router
from app.api import enrollment as enrollment_router
from app.api import enroll_company as enroll_company_router
from app.api import onboarding_drives as onboarding_drives_router
from app.api import whatsapp_webhook as whatsapp_webhook_router
from app.config import get_settings
from app.database import init_db

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok", "app": settings.app_name, "env": settings.app_env}


app.include_router(auth_router.router)
app.include_router(users_router.router)
app.include_router(masters_router.router)
app.include_router(companies_router.router)
app.include_router(edit_requests_router.router)
app.include_router(company_subitems_router.router)
app.include_router(uploads_router.router)
app.include_router(dashboard_router.router)
app.include_router(audit_router.router)
app.include_router(reports_router.router)
app.include_router(enrollment_router.router)
app.include_router(enroll_company_router.router, prefix="/api/enroll")
app.include_router(onboarding_drives_router.router)
app.include_router(whatsapp_webhook_router.router)
