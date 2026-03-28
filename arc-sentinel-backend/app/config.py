from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    supabase_url: str
    supabase_service_key: str
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.0-flash"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000,https://arc-sentinel-web.vercel.app,https://arc-sentinel-qjg5.onrender.com"
    app_env: str = "development"


@lru_cache()
def get_settings() -> Settings:
    # Pydantic fills values from .env; ignore static type checker complaining about missing args
    return Settings()  # type: ignore[call-arg]
