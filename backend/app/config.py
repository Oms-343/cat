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

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
