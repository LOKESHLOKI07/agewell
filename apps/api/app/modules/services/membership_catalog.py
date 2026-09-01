"""Canonical AgeWell Basic Membership catalogue (19 services).

Used by seed and kept in sync with the mobile `serviceCatalog` slugs.
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
        "name": "Emergency SOS",
        "category": ServiceCategory.CARE,
        "description": "24x7 panic alert to family, Care Manager and companion.",
        "admin_inbox": "emergencies",
    },
    {
        "slug": "care-manager",
        "name": "Care Manager Visit",
        "category": ServiceCategory.CARE,
        "description": "Monthly visit, contact and service history.",
        "admin_inbox": "visits",
    },
    {
        "slug": "companion",
        "name": "Companion Visit",
        "category": ServiceCategory.CARE,
        "description": "Daily home visit for assistance and company.",
        "admin_inbox": "visits",
    },
    {
        "slug": "grocery",
        "name": "Grocery Delivery",
        "category": ServiceCategory.FOOD_HOME,
        "description": "Catalogue, cart or upload a shopping list/photo.",
        "admin_inbox": "orders",
    },
    {
        "slug": "food",
        "name": "Food Delivery",
        "category": ServiceCategory.FOOD_HOME,
        "description": "Maharashtrian, Gujarati and South Indian meals.",
        "admin_inbox": "orders",
    },
    {
        "slug": "medicine",
        "name": "Medicine Delivery",
        "category": ServiceCategory.HEALTH,
        "description": "Upload prescription and track home delivery.",
        "admin_inbox": "orders",
    },
    {
        "slug": "lab-testing",
        "name": "Lab Testing",
        "category": ServiceCategory.HEALTH,
        "description": "Book nearby labs with home or lab visit.",
        "admin_inbox": "appointments",
    },
    {
        "slug": "monthly-blood-test",
        "name": "Monthly Blood Test",
        "category": ServiceCategory.HEALTH,
        "description": "Monthly complete body test and report status.",
        "admin_inbox": "appointments",
    },
    {
        "slug": "doctor",
        "name": "Doctor Consultation",
        "category": ServiceCategory.HEALTH,
        "description": "Consult trusted doctors through AgeWell.",
        "admin_inbox": "appointments",
    },
    {
        "slug": "medical-history",
        "name": "Medical History",
        "category": ServiceCategory.HEALTH,
        "description": "Reports, notes and documents in one place.",
        "admin_inbox": "records",
    },
    {
        "slug": "tech-assistance",
        "name": "Tech Assistance",
        "category": ServiceCategory.CARE,
        "description": "Help with phone, apps and digital payments.",
        "admin_inbox": "requests",
    },
    {
        "slug": "events-trips",
        "name": "Events & Trips",
        "category": ServiceCategory.COMMUNITY,
        "description": "Local events and AgeWell outings.",
        "admin_inbox": "community",
    },
    {
        "slug": "legal",
        "name": "Legal Assistance",
        "category": ServiceCategory.ADD_ON,
        "description": "Request a consultation with AgeWell lawyers.",
        "admin_inbox": "requests",
    },
    {
        "slug": "ca",
        "name": "CA Assistance",
        "category": ServiceCategory.ADD_ON,
        "description": "Financial consultation with AgeWell CAs.",
        "admin_inbox": "requests",
    },
    {
        "slug": "transport",
        "name": "Outstation Transport",
        "category": ServiceCategory.MOBILITY,
        "description": "Request a trained driver for outstation trips.",
        "admin_inbox": "requests",
    },
    {
        "slug": "home-repair",
        "name": "House Repair",
        "category": ServiceCategory.FOOD_HOME,
        "description": "Plumbing, electrical, carpentry, AC and more.",
        "admin_inbox": "requests",
    },
    {
        "slug": "pooja",
        "name": "Pooja Helper",
        "category": ServiceCategory.FOOD_HOME,
        "description": "Pooja packages with helpers at home.",
        "admin_inbox": "orders",
    },
    {
        "slug": "home-inspection",
        "name": "Home Inspection",
        "category": ServiceCategory.FOOD_HOME,
        "description": "Monthly home safety check reports.",
        "admin_inbox": "records",
    },
    {
        "slug": "cctv",
        "name": "CCTV Dashboard",
        "category": ServiceCategory.ADD_ON,
        "description": "Live entrance camera coverage.",
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
