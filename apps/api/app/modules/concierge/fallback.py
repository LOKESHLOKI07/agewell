"""Keyword / heuristic intent parser used when Gemini is unavailable."""

from __future__ import annotations

import re

from app.modules.concierge.catalog import AGEWELL_SERVICES
from app.modules.concierge.prompt import NAVIGATE_HINTS
from app.modules.concierge.schemas import ConciergeIntent


def parse_intent_fallback(message: str) -> dict:
    text = message.strip().lower()

    emergency_patterns = (
        r"\b(emergency|sos|help me now|i need help now|fall|fell|chest pain|can't breathe|cannot breathe)\b",
        r"\b(ambulance|urgent help)\b",
    )
    if any(re.search(p, text) for p in emergency_patterns):
        return {
            "intent": ConciergeIntent.emergency.value,
            "confidence": 0.95,
            "reply": "It sounds like you might need help right now. I can open Emergency Support for you.",
            "parameters": {},
        }

    if re.search(r"\b(hi|hello|namaste|hey|good morning|good evening|how are you)\b", text):
        return {
            "intent": ConciergeIntent.chat.value,
            "confidence": 0.9,
            "reply": (
                "Namaste! I am AgeWell Bot. I can help with all membership services — "
                "medicines, groceries, companion, doctor visits, transport, home help, and more. "
                "What would you like help with today?"
            ),
            "parameters": {},
        }

    if re.search(r"\b(what can you|which services|list services|all services|help me with)\b", text):
        return {
            "intent": ConciergeIntent.chat.value,
            "confidence": 0.9,
            "reply": (
                "I can help with Emergency Support, Care Manager, Companion, Medicines, Health Check, "
                "Blood Test, Doctor visit, Groceries, Errands, Cyber Security, Banking, CA, Events, "
                "House Maintenance, Pooja, Legal, Transport, Home Inspection, and CCTV. "
                "Tell me what you need in your own words."
            ),
            "parameters": {},
        }

    if re.search(r"\b(care manager|call my care|talk to (my )?care|speak to (my )?care)\b", text):
        return {
            "intent": ConciergeIntent.care_manager_call.value,
            "confidence": 0.92,
            "reply": "Of course. I can ask your Care Manager to call you back. Shall I continue?",
            "parameters": {"service_slug": "care-manager"},
        }

    if re.search(r"\b(where is|order status|track|delivery status)\b", text):
        return {
            "intent": ConciergeIntent.order_status.value,
            "confidence": 0.9,
            "reply": "Sure — let me check your recent deliveries for you.",
            "parameters": {},
        }

    if re.search(r"\b(membership|visits left|how many|usage|what.*(plan|membership).*include)\b", text):
        return {
            "intent": ConciergeIntent.membership_usage.value,
            "confidence": 0.9,
            "reply": "I can check your membership usage. One moment.",
            "parameters": {},
        }

    if re.search(r"\b(health record|health records|my health)\b", text):
        return {
            "intent": ConciergeIntent.navigate.value,
            "confidence": 0.9,
            "reply": "Of course. I can open your Health section.",
            "parameters": {"navigate_to": "/health"},
        }

    for hint, path in NAVIGATE_HINTS.items():
        if hint in text and re.search(r"\b(show|open|go to|take me|navigate)\b", text):
            return {
                "intent": ConciergeIntent.navigate.value,
                "confidence": 0.85,
                "reply": f"Sure — I can open {hint} for you.",
                "parameters": {"navigate_to": path},
            }

    # Prefer longest keyword matches across all 21 services
    best: tuple[int, dict] | None = None
    for service in AGEWELL_SERVICES:
        for keyword in service["keywords"]:
            if len(keyword) <= 3:
                matched = bool(re.search(rf"\b{re.escape(keyword)}\b", text))
            else:
                matched = keyword in text
            if not matched:
                continue
            score = len(keyword)
            if best is None or score > best[0]:
                slug = service["slug"]
                if slug == "emergency-sos":
                    continue
                if not service["bookable"]:
                    best = (
                        score,
                        {
                            "intent": ConciergeIntent.navigate.value,
                            "confidence": 0.86,
                            "reply": f"I can open {service['title']} for you.",
                            "parameters": {"navigate_to": service["href"], "service_slug": slug},
                        },
                    )
                else:
                    best = (
                        score,
                        {
                            "intent": ConciergeIntent.request_service.value,
                            "confidence": 0.88,
                            "reply": (
                                f"I can help with {service['title']}. {service['description']} "
                                "Want me to place a request?"
                            ),
                            "parameters": {
                                "service_slug": slug,
                                "items_note": message.strip(),
                                "when": "soon",
                            },
                        },
                    )
    if best:
        return best[1]

    return {
        "intent": ConciergeIntent.chat.value,
        "confidence": 0.55,
        "reply": (
            "I am here with you. You can ask me anything about AgeWell — "
            "or say something like “I need medicines”, “call my care manager”, or “book a companion”. "
            "How can I help?"
        ),
        "parameters": {},
    }
