"""Canonical AgeWell Single Membership catalogue (21 services).

Used by seed and kept in sync with the mobile `serviceCatalog` slugs.
Order matches the product brochure. Food Delivery lives in addon_catalog.
admin_inbox tells ops which admin screen fulfills the member action.
"""

from __future__ import annotations

from typing import TypedDict

from app.modules.services.models import ServiceCategory


class MembershipServiceDef(TypedDict):
    slug: str
    name: str
    category: ServiceCategory
    description: str
    admin_inbox: str


MEMBERSHIP_SERVICES: list[MembershipServiceDef] = [
    {
        "slug": "emergency-sos",
        "name": "Emergency Support",
        "category": ServiceCategory.CARE,
        "description": "24x7 panic alert to family, Care Manager and companion with hospital coordination.",
        "admin_inbox": "emergencies",
    },
    {
        "slug": "care-manager",
        "name": "Care Manager Visit",
        "category": ServiceCategory.CARE,
        "description": "Monthly visit to check well-being and assist with membership services.",
        "admin_inbox": "visits",
    },
    {
        "slug": "companion",
        "name": "Companion Visit",
        "category": ServiceCategory.CARE,
        "description": "20 companion visits a month for assistance or meetup (max 30 mins). Always available for emergency.",
        "admin_inbox": "visits",
    },
    {
        "slug": "medicine",
        "name": "Medicine Delivery",
        "category": ServiceCategory.HEALTH,
        "description": "Upload prescriptions at least 1 day before delivery.",
        "admin_inbox": "orders",
    },
    {
        "slug": "health-check",
        "name": "Health Check",
        "category": ServiceCategory.HEALTH,
        "description": "Free monthly BP, pulse, SpO2, temperature and blood sugar checks.",
        "admin_inbox": "appointments",
    },
    {
        "slug": "monthly-blood-test",
        "name": "Monthly Blood Test",
        "category": ServiceCategory.HEALTH,
        "description": "One CBC every month with home sample collection. LFT, KFT, lipid, thyroid and urine tests cost extra.",
        "admin_inbox": "appointments",
    },
    {
        "slug": "doctor",
        "name": "Doctor / Physician Visit",
        "category": ServiceCategory.HEALTH,
        "description": "One monthly doctor visit to review health and reports.",
        "admin_inbox": "appointments",
    },
    {
        "slug": "grocery",
        "name": "Grocery Delivery",
        "category": ServiceCategory.FOOD_HOME,
        "description": "Upload a grocery list and receive fresh groceries from a nearby shop.",
        "admin_inbox": "orders",
    },
    {
        "slug": "small-errands",
        "name": "Small Errands Assistance",
        "category": ServiceCategory.CARE,
        "description": "Companion calls before the visit and assists with small manageable errands.",
        "admin_inbox": "visits",
    },
    {
        "slug": "errand-coordination",
        "name": "Coordination for Other Errands",
        "category": ServiceCategory.CARE,
        "description": "Companion coordinates errands such as ironing, haircut and personal services.",
        "admin_inbox": "requests",
    },
    {
        "slug": "cyber-security",
        "name": "Cyber Security Guidance",
        "category": ServiceCategory.CARE,
        "description": "Guidance on online scams, OTP sharing and fraud awareness by trained companion.",
        "admin_inbox": "requests",
    },
    {
        "slug": "banking-companion",
        "name": "Banking Companion",
        "category": ServiceCategory.CARE,
        "description": "Book a companion for bank visits such as pension withdrawal and cheque deposit.",
        "admin_inbox": "visits",
    },
    {
        "slug": "ca",
        "name": "CA Assistance",
        "category": ServiceCategory.ADD_ON,
        "description": "Exclusive CA access for ITR filing and financial consultations (extra cost).",
        "admin_inbox": "requests",
    },
    {
        "slug": "events-trips",
        "name": "Local Events & Trips",
        "category": ServiceCategory.COMMUNITY,
        "description": "Nearby events and at least one supported AgeWell tour a year with companion support (tours cost extra).",
        "admin_inbox": "community",
    },
    {
        "slug": "home-repair",
        "name": "House Maintenance",
        "category": ServiceCategory.FOOD_HOME,
        "description": "Plumbing, electrical, carpentry, AC service and more with AgeWell coordination.",
        "admin_inbox": "requests",
    },
    {
        "slug": "pooja",
        "name": "House Pooja Assistance",
        "category": ServiceCategory.FOOD_HOME,
        "description": "Pooja options on the app with 1–2 helpers at home (extra charges).",
        "admin_inbox": "orders",
    },
    {
        "slug": "legal",
        "name": "Legal Assistance",
        "category": ServiceCategory.ADD_ON,
        "description": "Exclusive lawyer consultations (extra cost).",
        "admin_inbox": "requests",
    },
    {
        "slug": "local-transport",
        "name": "Local Area Transportation",
        "category": ServiceCategory.MOBILITY,
        "description": "Companion-supported coordination between cabs and rickshaws.",
        "admin_inbox": "requests",
    },
    {
        "slug": "transport",
        "name": "Outstation Transport",
        "category": ServiceCategory.MOBILITY,
        "description": "Trained driver assistance for outstation trips (cost as per trip).",
        "admin_inbox": "requests",
    },
    {
        "slug": "home-inspection",
        "name": "Home Inspection",
        "category": ServiceCategory.FOOD_HOME,
        "description": "Monthly home safety check for washroom, bedroom, entrance and more.",
        "admin_inbox": "records",
    },
    {
        "slug": "cctv",
        "name": "CCTV Dashboard",
        "category": ServiceCategory.ADD_ON,
        "description": "Entrance CCTV camera coverage available on-app.",
        "admin_inbox": "special",
    },
]


ADMIN_INBOX_LABELS = {
    "emergencies": "Emergencies",
    "visits": "Visits",
    "orders": "Orders (to grow)",
    "appointments": "Appointments",
    "requests": "Service requests",
    "community": "Community",
    "records": "Health / documents",
    "special": "Special (CCTV later)",
}
