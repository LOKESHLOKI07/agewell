"""Home add-on booking services (not part of the 19 Basic Membership set).

Slugs stay aligned with mobile `addOnServiceCatalog`.
"""

from __future__ import annotations

from app.modules.services.membership_catalog import MembershipServiceDef
from app.modules.services.models import ServiceCategory

ADDON_BOOKING_SERVICES: list[MembershipServiceDef] = [
    {
        "slug": "emergency-companion",
        "name": "Emergency Companion",
        "category": ServiceCategory.ADD_ON,
        "description": "At-hospital companion for 12 or 24 hours.",
        "admin_inbox": "requests",
    },
    {
        "slug": "stool-cleaning",
        "name": "Stool Cleaning",
        "category": ServiceCategory.ADD_ON,
        "description": "Morning and evening cleaning and sponging.",
        "admin_inbox": "requests",
    },
    {
        "slug": "maid-assistance",
        "name": "Maid Service",
        "category": ServiceCategory.ADD_ON,
        "description": "House and utensils cleaning, cloth drying.",
        "admin_inbox": "requests",
    },
    {
        "slug": "ayurvedic-massage",
        "name": "Ayurvedic Massage",
        "category": ServiceCategory.ADD_ON,
        "description": "Relax and rejuvenate massage at home.",
        "admin_inbox": "requests",
    },
]
