"""Application configuration using pydantic-settings."""

from pathlib import Path

from pydantic_settings import BaseSettings

# Resolve the project root (fastapi/) relative to this file
BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Application settings.

    Values can be overridden via environment variables or a .env file.
    """

    APP_TITLE: str = "GeoMarket — API"
    APP_DESCRIPTION: str = (
        "Geospatial API for culinary locations in Batam, Indonesia. "
        "Browse, search, and discover nearby restaurants and food spots."
    )
    APP_VERSION: str = "1.0.0"

    # SQLite database path (relative to fastapi/)
    DATABASE_URL: str = (
        f"sqlite:///{BASE_DIR / 'db' / 'Indonesia.Batam.Kuliner.202406162232.db'}"
    )

    # Default pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
