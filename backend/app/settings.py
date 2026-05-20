from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    database_url: str = "postgresql+psycopg://passwdman2:passwdman2_dev_password@localhost:5432/passwdman2"
    backend_cors_origins: str = "http://localhost:5173,http://localhost:6084"
    session_cookie_name: str = "passwdman2_session"
    session_cookie_secure: bool = False
    session_cookie_samesite: str = "lax"
    session_ttl_minutes: int = 1440
    login_max_failures: int = 5
    login_lockout_minutes: int = 15

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        if self.app_env.strip().lower() == "production":
            return []

        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
