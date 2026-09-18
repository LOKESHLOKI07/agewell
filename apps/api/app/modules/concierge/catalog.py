"""AgeWell membership services the Care Concierge may discuss or request."""

from __future__ import annotations

from typing import TypedDict


class ServiceInfo(TypedDict):
    slug: str
    title: str
    description: str
    href: str
    bookable: bool
    keywords: tuple[str, ...]


# Brochure order — 21 membership services (food is an add-on, not listed here).
AGEWELL_SERVICES: list[ServiceInfo] = [
    {
        "slug": "emergency-sos",
        "title": "Emergency Support",
        "description": "24×7 panic alert to family, Care Manager and companion.",
        "href": "/(tabs)/sos",
        "bookable": False,  # opened via SOS UI, not a service request
        "keywords": ("emergency", "sos", "help me now", "urgent"),
    },
    {
        "slug": "care-manager",
        "title": "Care Manager",
        "description": "Personal care coordinator — call, message or schedule a visit.",
        "href": "/membership/care-manager",
        "bookable": True,
        "keywords": ("care manager", "caremanager", "coordinator"),
    },
    {
        "slug": "companion",
        "title": "Companion Visit",
        "description": "Companion visits for assistance or meetup (max 30 mins).",
        "href": "/membership/companion",
        "bookable": True,
        "keywords": ("companion", "someone to visit", "stay with me"),
    },
    {
        "slug": "medicine",
        "title": "Medicine Delivery",
        "description": "Prescription upload and medicine delivery.",
        "href": "/membership/medicine",
        "bookable": True,
        "keywords": ("medicine", "medicines", "pharmacy", "prescription", "pills"),
    },
    {
        "slug": "health-check",
        "title": "Health Check",
        "description": "Monthly BP, pulse, SpO₂, temperature and blood sugar.",
        "href": "/membership/health-check",
        "bookable": True,
        "keywords": ("health check", "bp", "blood pressure", "spo2", "vitals"),
    },
    {
        "slug": "monthly-blood-test",
        "title": "Monthly Blood Test",
        "description": "CBC with home collection; other panels may cost extra.",
        "href": "/membership/monthly-blood-test",
        "bookable": True,
        "keywords": ("blood test", "cbc", "lab test", "blood sample"),
    },
    {
        "slug": "doctor",
        "title": "Doctor / Physician Visit",
        "description": "Monthly doctor visit to review health and reports.",
        "href": "/membership/doctor",
        "bookable": True,
        "keywords": ("doctor", "physician", "gp visit"),
    },
    {
        "slug": "grocery",
        "title": "Grocery Delivery",
        "description": "Upload a list and receive groceries nearby.",
        "href": "/membership/grocery",
        "bookable": True,
        "keywords": ("grocery", "groceries", "vegetables", "ration"),
    },
    {
        "slug": "small-errands",
        "title": "Small Errands Assistance",
        "description": "Day-to-day errands with companion help nearby.",
        "href": "/membership/small-errands",
        "bookable": True,
        "keywords": ("small errand", "errands", "post office", "documents"),
    },
    {
        "slug": "errand-coordination",
        "title": "Other Errands Assistance",
        "description": "Coordinate ironing, haircuts, cleaning, minor repairs.",
        "href": "/membership/errand-coordination",
        "bookable": True,
        "keywords": ("cleaning", "iron", "haircut", "other errand"),
    },
    {
        "slug": "cyber-security",
        "title": "Cyber Security Guidance",
        "description": "Scam awareness, OTP risks and fraud follow-up.",
        "href": "/membership/cyber-security",
        "bookable": True,
        "keywords": ("cyber", "scam", "otp", "fraud", "phishing"),
    },
    {
        "slug": "banking-companion",
        "title": "Banking Companion",
        "description": "Companion for pension, cheque deposit and bank visits.",
        "href": "/membership/banking-companion",
        "bookable": True,
        "keywords": ("bank", "banking", "pension", "cheque"),
    },
    {
        "slug": "ca",
        "title": "CA Assistance",
        "description": "CA support for ITR filing and financial guidance (extra cost).",
        "href": "/membership/ca",
        "bookable": True,
        "keywords": ("ca", "chartered accountant", "itr", "tax"),
    },
    {
        "slug": "events-trips",
        "title": "Local Events & Trips",
        "description": "Nearby events and AgeWell tours with companion support.",
        "href": "/membership/events-trips",
        "bookable": False,
        "keywords": ("event", "trip", "tour", "outing"),
    },
    {
        "slug": "home-repair",
        "title": "House Maintenance",
        "description": "Plumbing, electrical, carpentry, AC and more.",
        "href": "/membership/home-repair",
        "bookable": True,
        "keywords": ("plumber", "electrician", "repair", "maintenance", "ac repair"),
    },
    {
        "slug": "pooja",
        "title": "House Pooja Assistance",
        "description": "Spiritual care with 1–2 helpers at home.",
        "href": "/membership/pooja",
        "bookable": True,
        "keywords": ("pooja", "puja", "priest", "hawan"),
    },
    {
        "slug": "legal",
        "title": "Legal Assistance",
        "description": "Access to lawyer consultations (costs extra).",
        "href": "/membership/legal",
        "bookable": True,
        "keywords": ("legal", "lawyer", "advocate"),
    },
    {
        "slug": "local-transport",
        "title": "Local Area Transportation",
        "description": "Companion-supported local cab / rickshaw coordination.",
        "href": "/membership/local-transport",
        "bookable": True,
        "keywords": ("local transport", "cab", "taxi", "rickshaw", "auto"),
    },
    {
        "slug": "transport",
        "title": "Outstation Transport",
        "description": "Driver assistance for outstation trips.",
        "href": "/membership/transport",
        "bookable": True,
        "keywords": ("outstation", "long distance", "out of town"),
    },
    {
        "slug": "home-inspection",
        "title": "Home Inspection",
        "description": "Monthly home safety check reports.",
        "href": "/membership/home-inspection",
        "bookable": False,
        "keywords": ("home inspection", "safety check", "house check"),
    },
    {
        "slug": "cctv",
        "title": "CCTV Dashboard",
        "description": "Entrance CCTV coverage in the app.",
        "href": "/membership/cctv",
        "bookable": False,
        "keywords": ("cctv", "camera", "surveillance"),
    },
]

SERVICES_BY_SLUG = {item["slug"]: item for item in AGEWELL_SERVICES}

# Only these hrefs may be used for client navigation (prevents Gemini inventing routes).
ALLOWED_HREFS: dict[str, str] = {
    "/(tabs)/sos": "/(tabs)/sos",
    "/(tabs)/services": "/(tabs)/services",
    "/(tabs)/orders": "/(tabs)/orders",
    "/(tabs)/community": "/(tabs)/community",
    "/(tabs)/profile": "/(tabs)/profile",
    "/(tabs)/health": "/(tabs)/health",
    "/health": "/health",
    **{item["href"]: item["href"] for item in AGEWELL_SERVICES},
}

# Loose aliases the model sometimes invents → real routes.
HREF_ALIASES: dict[str, str] = {
    "cctv": "/membership/cctv",
    "/cctv": "/membership/cctv",
    "cctv dashboard": "/membership/cctv",
    "/membership/cctv-dashboard": "/membership/cctv",
    "/membership/cctv_dashboard": "/membership/cctv",
    "camera": "/membership/cctv",
    "surveillance": "/membership/cctv",
    "/membership/emergency-sos": "/(tabs)/sos",
    "sos": "/(tabs)/sos",
    "emergency": "/(tabs)/sos",
    "health": "/health",
    "/membership/health": "/health",
    "services": "/(tabs)/services",
    "orders": "/(tabs)/orders",
}


def resolve_navigate_href(
    navigate_to: str | None = None,
    service_slug: str | None = None,
    *,
    fallback: str = "/(tabs)/services",
) -> str:
    """Map model/fallback paths onto real Expo routes only."""
    slug = (service_slug or "").strip().lower()
    if slug in SERVICES_BY_SLUG:
        return SERVICES_BY_SLUG[slug]["href"]

    raw = (navigate_to or "").strip()
    if not raw:
        return fallback

    key = raw.lower().rstrip("/")
    if key in HREF_ALIASES:
        return HREF_ALIASES[key]
    if raw in ALLOWED_HREFS:
        return ALLOWED_HREFS[raw]
    if key in ALLOWED_HREFS:
        return ALLOWED_HREFS[key]

    # /membership/<slug> form
    if key.startswith("/membership/"):
        maybe_slug = key.split("/membership/", 1)[-1]
        if maybe_slug in SERVICES_BY_SLUG:
            return SERVICES_BY_SLUG[maybe_slug]["href"]

    # bare slug
    if key in SERVICES_BY_SLUG:
        return SERVICES_BY_SLUG[key]["href"]

    for service in AGEWELL_SERVICES:
        title = service["title"].lower()
        if title in key or key in title:
            return service["href"]

    return fallback


SERVICE_CATALOG_FOR_PROMPT = "\n".join(
    (
        f"- {item['slug']}: {item['title']} — {item['description']} (bookable)"
        if item["bookable"]
        else f"- {item['slug']}: {item['title']} — {item['description']} (open in app; navigate_to must be {item['href']})"
    )
    for item in AGEWELL_SERVICES
)
