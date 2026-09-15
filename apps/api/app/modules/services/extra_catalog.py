"""Optional extras still reachable by deep link (not part of Single 21 or home add-ons)."""

from __future__ import annotations

from app.modules.services.membership_catalog import MembershipServiceDef
from app.modules.services.models import ServiceCategory

EXTRA_SERVICES: list[MembershipServiceDef] = [
    {
        "slug": "lab-testing",
        "name": "Lab Testing",
        "category": ServiceCategory.HEALTH,
        "description": "Book nearby labs with home or lab visit (extra tests beyond monthly health check).",
        "admin_inbox": "appointments",
    },
    {
        "slug": "medical-history",
        "name": "Medical History",
        "category": ServiceCategory.HEALTH,
        "description": "Reports, notes and documents in one place.",
        "admin_inbox": "records",
    },
]
