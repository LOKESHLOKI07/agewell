"""Service cities for admin scoping (Mumbai vs Chandrapur).

Tier is a pricing property of the city. Admins are scoped by city.
Super staff (ADMIN/OPERATIONS with no city) see every city.
"""

from __future__ import annotations

import re
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.sql import ColumnElement

CITY_MUMBAI = "mumbai"
CITY_CHANDRAPUR = "chandrapur"
SERVICE_CITIES = frozenset({CITY_MUMBAI, CITY_CHANDRAPUR})

CITY_LABELS = {
    CITY_MUMBAI: "Mumbai",
    CITY_CHANDRAPUR: "Chandrapur",
}

CITY_TIER = {
    CITY_MUMBAI: "tier1",
    CITY_CHANDRAPUR: "tier2",
}

_MUMBAI_KEYWORDS = ("kandivali", "kandivli", "borivali", "borivli")
_CHANDRAPUR_KEYWORDS = ("warora", "bhadravati", "chandrapur")
_WANI = re.compile(r"(^|[^a-z0-9])wani([^a-z0-9]|$)")

_TIER1_BOUNDS = {"minLat": 19.17, "maxLat": 19.28, "minLng": 72.81, "maxLng": 72.9}
_TIER2_BOUNDS = {"minLat": 19.95, "maxLat": 20.35, "minLng": 78.8, "maxLng": 79.25}

_NOT_FOUND_SENIOR = "Senior not found"
_NOT_FOUND_USER = "User not found"


def normalize_city(value: Optional[str], *, required: bool = False) -> Optional[str]:
    if value is None:
        city = None
    else:
        city = value.strip().lower() or None
    if city is not None and city not in SERVICE_CITIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="City must be Mumbai or Chandrapur.",
        )
    if required and city is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Choose Mumbai or Chandrapur for this admin.",
        )
    return city


def staff_city(user) -> Optional[str]:
    """None means super staff (all cities). Non-staff city is still returned."""
    city = getattr(user, "service_city", None)
    if not city:
        return None
    return str(city).strip().lower() or None


def is_super_staff(user) -> bool:
    from app.modules.users.models import RoleEnum

    return user.role in (RoleEnum.ADMIN, RoleEnum.OPERATIONS) and not staff_city(user)


def _in_bounds(lat: float, lng: float, bounds: dict) -> bool:
    return (
        bounds["minLat"] <= lat <= bounds["maxLat"]
        and bounds["minLng"] <= lng <= bounds["maxLng"]
    )


def _city_from_text(text: str | None) -> Optional[str]:
    normalized = (text or "").strip().lower()
    if not normalized:
        return None
    mumbai = any(keyword in normalized for keyword in _MUMBAI_KEYWORDS) or "mumbai" in normalized
    chandrapur = any(keyword in normalized for keyword in _CHANDRAPUR_KEYWORDS) or bool(_WANI.search(normalized))
    if mumbai and not chandrapur:
        return CITY_MUMBAI
    if chandrapur:
        return CITY_CHANDRAPUR
    return None


def resolve_service_city(
    *,
    address: str | None = None,
    location_query: str | None = None,
    location_lat: float | None = None,
    location_lng: float | None = None,
) -> Optional[str]:
    if location_lat is not None and location_lng is not None:
        if _in_bounds(float(location_lat), float(location_lng), _TIER1_BOUNDS):
            return CITY_MUMBAI
        if _in_bounds(float(location_lat), float(location_lng), _TIER2_BOUNDS):
            return CITY_CHANDRAPUR
    from_query = _city_from_text(location_query)
    if from_query:
        return from_query
    return _city_from_text(address)


def ensure_staff_city_for_senior(actor, senior) -> None:
    city = staff_city(actor)
    if not city:
        return
    if senior is None or getattr(senior, "service_city", None) != city:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=_NOT_FOUND_SENIOR)


def ensure_staff_can_see_user(actor, target) -> None:
    city = staff_city(actor)
    if not city or target is None:
        if target is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=_NOT_FOUND_USER)
        return
    if getattr(target, "id", None) == getattr(actor, "id", None):
        return
    if getattr(target, "service_city", None) != city:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=_NOT_FOUND_USER)


def seniors_in_city_select(city: str):
    from app.modules.seniors.models import Senior

    return select(Senior.id).where(Senior.service_city == city)


def apply_city_fk(stmt, count_stmt, fk_column: ColumnElement, city: Optional[str]):
    if not city:
        return stmt, count_stmt
    ids = seniors_in_city_select(city)
    return stmt.where(fk_column.in_(ids)), count_stmt.where(fk_column.in_(ids))
