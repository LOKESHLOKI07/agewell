"""Home add-on booking services (not part of the 21 Single Membership set).

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
        "description": "Hospital companion for 8–10 hours during hospitalization. Extra cost based on availability.",
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
        "description": "House and utensil cleaning, stock drying. Rs 6,500 / month.",
        "admin_inbox": "requests",
    },
    {
        "slug": "ayurvedic-massage",
        "name": "Ayurvedic Massage",
        "category": ServiceCategory.ADD_ON,
        "description": "Ayurvedic massage at home by a certified therapist. Rs 1,500 / 45 mins, Rs 2,000 / 60 mins.",
        "admin_inbox": "requests",
    },
    {
        "slug": "food",
        "name": "Food Delivery",
        "category": ServiceCategory.FOOD_HOME,
        "description": "Breakfast, lunch and dinner — monthly or daily home-made tiffin service.",
        "admin_inbox": "orders",
    },
]
