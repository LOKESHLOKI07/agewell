"""Service-area helpers for admin senior filtering and member home.

Mirrors mobile `serviceArea.ts` localities (Mumbai Tier 1 + Chandrapur Tier 2).
Stored `senior.in_service_area` wins when set; otherwise address keywords.
"""

from __future__ import annotations

import re

from sqlalchemy import ColumnElement, and_, or_

SERVICE_AREA_KEYWORDS = (
    "kandivali",
    "kandivli",
    "borivali",
    "borivli",
    "warora",
    "bhadravati",
    "wani",
)

_SHORT_KEYWORD = re.compile(r"(^|[^a-z0-9])wani([^a-z0-9]|$)")


def address_in_service_area(address: str | None) -> bool:
    text = (address or "").strip().lower()
    if not text:
        return False
    for keyword in SERVICE_AREA_KEYWORDS:
        if keyword == "wani":
            if _SHORT_KEYWORD.search(text):
                return True
            continue
        if keyword in text:
            return True
    return False


def resolve_in_service_area(senior) -> bool:
    """Prefer explicit flag from location check; else derive from address text."""
    stored = getattr(senior, "in_service_area", None)
    if stored is not None:
        return bool(stored)
    return address_in_service_area(getattr(senior, "address", None))


def service_area_sql_clause(address_column) -> ColumnElement[bool]:
    clauses = []
    for keyword in SERVICE_AREA_KEYWORDS:
        if keyword == "wani":
            clauses.append(address_column.ilike("%wani%"))
            continue
        clauses.append(address_column.ilike(f"%{keyword}%"))
    return or_(*clauses)


def effective_in_service_area_sql(senior_model) -> ColumnElement[bool]:
    """SQL equivalent of resolve_in_service_area for list filters."""
    addr = service_area_sql_clause(senior_model.address)
    return or_(
        senior_model.in_service_area.is_(True),
        and_(senior_model.in_service_area.is_(None), addr),
    )
