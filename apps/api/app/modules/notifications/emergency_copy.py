from typing import Optional

from app.modules.emergency.models import EmergencyType

TYPE_LABELS = {
    EmergencyType.MEDICAL: "Medical Emergency",
    EmergencyType.HOSPITAL: "Hospital Assistance",
    EmergencyType.CARE_MANAGER: "Care Manager Assistance",
    EmergencyType.AGEWELL_SUPPORT: "AgeWell Support",
}

TRIGGER_LABELS = {
    "APP_SOS": "AgeWell App SOS",
    "HOME_PANIC_BUTTON": "Home Panic Button",
}


def emergency_type_label(emergency_type: EmergencyType) -> str:
    return TYPE_LABELS.get(emergency_type, "Emergency")


def trigger_source_label(source: Optional[str]) -> str:
    if not source:
        return "AgeWell App SOS"
    return TRIGGER_LABELS.get(source, source.replace("_", " ").title())


def senior_display_name(first_name: Optional[str], last_name: Optional[str] = None) -> str:
    parts = [part.strip() for part in (first_name or "", last_name or "") if part and part.strip()]
    return " ".join(parts) if parts else "the senior"


def senior_emergency_copy(type_label: str) -> tuple[str, str]:
    return (
        "Emergency Alert sent",
        f"Your {type_label} alert is on file. Family and Companion have been notified. "
        "Care Manager will be alerted if they do not respond shortly.",
    )


def family_emergency_copy(first_name: Optional[str], type_label: str) -> tuple[str, str]:
    name = (first_name or "").strip() or "the senior"
    return (
        "AgeWell Emergency",
        f"{name} has triggered an SOS. Tap to respond.",
    )


def care_manager_emergency_copy(type_label: str) -> tuple[str, str]:
    return (
        "AgeWell Emergency",
        f"No first response yet. A {type_label} SOS needs Care Manager attention. Tap to respond.",
    )


def companion_emergency_copy(first_name: Optional[str]) -> tuple[str, str]:
    name = (first_name or "").strip() or "the senior"
    return (
        "AgeWell Emergency",
        f"{name} has triggered an SOS. Tap to respond.",
    )


def support_emergency_copy(first_name: Optional[str]) -> tuple[str, str]:
    name = (first_name or "").strip() or "the senior"
    return (
        "AgeWell Emergency",
        f"Escalated SOS for {name}. AgeWell Support — tap to respond.",
    )
