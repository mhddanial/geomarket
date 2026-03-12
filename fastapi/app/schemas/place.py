"""Pydantic schemas for API request/response validation."""

from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, field_validator

T = TypeVar("T")


class PlaceOut(BaseModel):
    """Response schema for a single place."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    category: str | None = None
    rating: float | None = None
    review: int | None = None
    price_level: int | None = None
    services: str | None = None
    address: str | None = None
    open_hours: str | None = None
    phone: str | None = None
    url: str | None = None
    cluster: str | None = None

    # latitude / longitude are stored as TEXT in the DB — cast to float
    @field_validator("latitude", "longitude", mode="before")
    @classmethod
    def cast_coord_to_float(cls, v: str | float | None) -> float | None:
        if v is None or v == "":
            return None
        try:
            return float(v)
        except (ValueError, TypeError):
            return None


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response wrapper."""

    total: int
    page: int
    page_size: int
    total_pages: int
    data: list[T]
