"""Places router — Get Data & Search Data endpoints."""

import math

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import Float as SQLFloat
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.place import Place
from app.schemas.place import PaginatedResponse, PlaceOut

router = APIRouter(prefix="/api/v1/places", tags=["Places"])


# ---------------------------------------------------------------------------
# Helper: Haversine distance in kilometres
# ---------------------------------------------------------------------------
def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Return the great‑circle distance between two points (in km)."""
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlng / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ═══════════════════════════════════════════════════════════════════════════
# GET DATA ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════


@router.get(
    "/categories",
    response_model=list[str],
    summary="List all unique business categories",
)
def list_categories(db: Session = Depends(get_db)):
    """Return a sorted list of every distinct category in the dataset."""
    rows = (
        db.query(Place.category)
        .filter(Place.category.isnot(None), Place.category != "")
        .distinct()
        .order_by(Place.category)
        .all()
    )
    return [r[0] for r in rows]


@router.get(
    "/search",
    response_model=PaginatedResponse[PlaceOut],
    summary="Search places by keyword",
)
def search_places(
    q: str = Query(
        ..., min_length=1, description="Search query (name, category, or address)"
    ),
    page: int = Query(1, ge=1),
    page_size: int = Query(
        settings.DEFAULT_PAGE_SIZE, ge=1, le=settings.MAX_PAGE_SIZE
    ),
    db: Session = Depends(get_db),
):
    """Full‑text search across name, category, and address columns."""
    pattern = f"%{q}%"
    query = db.query(Place).filter(
        or_(
            Place.name.ilike(pattern),
            Place.category.ilike(pattern),
            Place.address.ilike(pattern),
        )
    )

    total = query.count()
    total_pages = math.ceil(total / page_size) if total else 0

    places = (
        query.order_by(Place.rating.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return PaginatedResponse(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        data=[PlaceOut.model_validate(p) for p in places],
    )


@router.get(
    "/nearby",
    response_model=PaginatedResponse[PlaceOut],
    summary="Find places near a coordinate",
)
def nearby_places(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lng: float = Query(..., ge=-180, le=180, description="Longitude"),
    radius_km: float = Query(5.0, gt=0, le=50, description="Search radius in km"),
    category: str | None = Query(None, description="Optional category filter"),
    page: int = Query(1, ge=1),
    page_size: int = Query(
        settings.DEFAULT_PAGE_SIZE, ge=1, le=settings.MAX_PAGE_SIZE
    ),
    db: Session = Depends(get_db),
):
    """Return places within *radius_km* of the given lat/lng (Haversine).

    Results are sorted by distance (nearest first).
    """
    query = db.query(Place).filter(
        Place.latitude.isnot(None),
        Place.longitude.isnot(None),
        Place.latitude != "",
        Place.longitude != "",
    )

    if category:
        query = query.filter(Place.category == category)

    # Bounding‑box pre‑filter (1 degree ≈ 111 km)
    delta = radius_km / 111.0
    query = query.filter(
        func.cast(Place.latitude, SQLFloat) >= lat - delta,
        func.cast(Place.latitude, SQLFloat) <= lat + delta,
        func.cast(Place.longitude, SQLFloat) >= lng - delta,
        func.cast(Place.longitude, SQLFloat) <= lng + delta,
    )

    candidates = query.all()

    # Precise Haversine filter + distance sort
    results: list[tuple[Place, float]] = []
    for p in candidates:
        try:
            p_lat, p_lng = float(p.latitude), float(p.longitude)  # type: ignore[arg-type]
        except (TypeError, ValueError):
            continue
        dist = _haversine_km(lat, lng, p_lat, p_lng)
        if dist <= radius_km:
            results.append((p, dist))

    results.sort(key=lambda x: x[1])

    total = len(results)
    total_pages = math.ceil(total / page_size) if total else 0
    page_results = results[(page - 1) * page_size : page * page_size]

    return PaginatedResponse(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        data=[PlaceOut.model_validate(place) for place, _ in page_results],
    )


@router.get(
    "",
    response_model=PaginatedResponse[PlaceOut],
    summary="List all places (paginated)",
)
def list_places(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(
        settings.DEFAULT_PAGE_SIZE,
        ge=1,
        le=settings.MAX_PAGE_SIZE,
        description="Items per page",
    ),
    category: str | None = Query(None, description="Filter by exact category"),
    min_rating: float | None = Query(
        None, ge=0, le=5, description="Minimum rating"
    ),
    db: Session = Depends(get_db),
):
    """Return a paginated list of places with optional filters."""
    query = db.query(Place)

    if category:
        query = query.filter(Place.category == category)
    if min_rating is not None:
        query = query.filter(Place.rating >= min_rating)

    total = query.count()
    total_pages = math.ceil(total / page_size) if total else 0

    places = (
        query.order_by(Place.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return PaginatedResponse(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        data=[PlaceOut.model_validate(p) for p in places],
    )


@router.get(
    "/{place_id}",
    response_model=PlaceOut,
    summary="Get a single place by ID",
)
def get_place(place_id: int, db: Session = Depends(get_db)):
    """Retrieve full details for a single place."""
    place = db.query(Place).filter(Place.id == place_id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    return PlaceOut.model_validate(place)
