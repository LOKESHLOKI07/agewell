"""Services a Service Companion (delivery executive) is allowed to cover."""

from __future__ import annotations

from typing import Iterable

from fastapi import HTTPException, status

from app.modules.care.models import CARE_STAFF_KIND_DELIVERY_EXECUTIVE

COMPANION_SERVICE_SLUGS = (
    "medicine",
    "grocery",
    "small-errands",
    "errand-coordination",
    "banking-companion",
)

COMPANION_SERVICE_SLUG_SET = set(COMPANION_SERVICE_SLUGS)

STAFF_KIND_SERVICE_COMPANION_ALIAS = "SERVICE_COMPANION"


def is_service_companion_kind(value: str | None) -> bool:
    kind = (value or "").strip().upper()
    return kind in {CARE_STAFF_KIND_DELIVERY_EXECUTIVE, STAFF_KIND_SERVICE_COMPANION_ALIAS}


def canonicalize_staff_kind(value: str) -> str:
    kind = value.strip().upper()
    if kind == STAFF_KIND_SERVICE_COMPANION_ALIAS:
        return CARE_STAFF_KIND_DELIVERY_EXECUTIVE
    return kind


def normalize_companion_service_slugs(
    value: object,
    *,
    required: bool,
) -> list[str]:
    if value is None:
        slugs: list[str] = []
    elif isinstance(value, str):
        slugs = [part.strip() for part in value.split(",") if part.strip()]
    elif isinstance(value, Iterable) and not isinstance(value, (bytes, bytearray)):
        slugs = [str(part).strip() for part in value if str(part).strip()]
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="companion_service_slugs must be a list of service slugs",
        )

    unique: list[str] = []
    seen: set[str] = set()
    for slug in slugs:
        if slug not in COMPANION_SERVICE_SLUG_SET:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Invalid companion service. Use one of: "
                    + ", ".join(COMPANION_SERVICE_SLUGS)
                ),
            )
        if slug in seen:
            continue
        seen.add(slug)
        unique.append(slug)

    if required and not unique:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Select at least one service for a Service Companion",
        )
    return unique


def companion_service_slugs_for(kind: str | None, stored: object) -> list[str]:
    if not is_service_companion_kind(kind):
        return []
    if isinstance(stored, list) and stored:
        return [str(item) for item in stored if str(item) in COMPANION_SERVICE_SLUG_SET]
    return list(COMPANION_SERVICE_SLUGS)
