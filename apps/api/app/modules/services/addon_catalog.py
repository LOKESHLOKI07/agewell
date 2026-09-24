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
        "description": (
            "Hospital companion provided during your hospitalization. Handles all hospital procedures. "
            "Stays at hospital for 8-10 hours. Updates family about health condition & Discharge. "
            "(Extra Cost based on availability)"
        ),
        "admin_inbox": "requests",
    },
    {
        "slug": "food",
        "name": "Tiffin Box",
        "category": ServiceCategory.FOOD_HOME,
        "description": "Breakfast, lunch and dinner — monthly or daily home-made tiffin service.",
        "admin_inbox": "orders",
    },
    {
        "slug": "stool-cleaning",
        "name": "Stool Cleaning",
        "category": ServiceCategory.ADD_ON,
        "description": "Monthly (Morning + evening) stool cleaning & servicing.",
        "admin_inbox": "requests",
    },
    {
        "slug": "maid-assistance",
        "name": "House Maid",
        "category": ServiceCategory.ADD_ON,
        "description": "Trained maid for house & utensil cleaning, stock drying.",
        "admin_inbox": "requests",
    },
    {
        "slug": "ayurvedic-massage",
        "name": "Ayurvedic Massage",
        "category": ServiceCategory.ADD_ON,
        "description": "Ayurvedic massage at home by certified therapist.",
        "admin_inbox": "requests",
    },
]
