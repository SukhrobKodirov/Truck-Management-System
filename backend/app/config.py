from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_env: str = "development"
    secret_key: str = "dev-secret-key"
    database_url: str = "sqlite:///./truckms.db"
    google_maps_api_key: str = ""
    samsara_api_key: str = ""
    samsara_base_url: str = "https://api.samsara.com"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
