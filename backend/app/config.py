from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "MSME Platform API"
    app_env: str = "development"
    database_url: str = "sqlite:///./msme.db"
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    # Dev/demo auth — fixed OTP shown in API responses (no email provider).
    dummy_otp_code: str = "1234"
    dummy_otp_expire_minutes: int = 15
    upload_dir: str = "uploads"
    max_upload_bytes: int = 5 * 1024 * 1024
    # WhatsApp Cloud API — leave token empty to stay in dry-run mode.
    whatsapp_access_token: str | None = None
    whatsapp_phone_number_id: str | None = None
    whatsapp_api_version: str = "v21.0"
    whatsapp_dry_run: bool = True
    whatsapp_default_language: str = "en"
    platform_registration_url: str = "https://msme.tn.gov.in/register"
    # Public URL of this API (for webhook registration in Meta Developer Console).
    app_public_url: str = "http://127.0.0.1:8000"
    whatsapp_webhook_verify_token: str = "msme-webhook-verify"
    whatsapp_app_secret: str | None = None
    # Inbound replies count as responses within this many days of an outbound campaign message.
    whatsapp_response_window_days: int = 30
    whatsapp_send_delay_seconds: float = 0.08

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def whatsapp_webhook_path(self) -> str:
        return "/api/whatsapp/webhook"

    @property
    def whatsapp_webhook_url(self) -> str:
        base = self.app_public_url.rstrip("/")
        return f"{base}{self.whatsapp_webhook_path}"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
