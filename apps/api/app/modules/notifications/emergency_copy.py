from typing import Optional

from app.modules.emergency.models import EmergencyType

TYPE_LABELS = {
    EmergencyType.MEDICAL: "Medical Emergency",
    EmergencyType.HOSPITAL: "Hospital Assistance",
    EmergencyType.CARE_MANAGER: "Care Manager Assistance",
    EmergencyType.AGEWELL_SUPPORT: "AgeWell Support",
}


def emergency_type_label(emergency_type: EmergencyType) -> str:
    return TYPE_LABELS.get(emergency_type, "Emergency")


def senior_emergency_copy(type_label: str) -> tuple[str, str]:
    return (
        "Emergency request created",
        f"Your {type_label} request is on file in AgeWell. Open Help to view the request.",
    )


def family_emergency_copy(first_name: Optional[str], type_label: str) -> tuple[str, str]:
    name = (first_name or "").strip() or "the senior"
    return (
        f"Emergency request for {name}",
        f"{name} created a {type_label} request in AgeWell.",
    )


def care_manager_emergency_copy(type_label: str) -> tuple[str, str]:
    return (
        "Emergency request for assigned senior",
        f"An assigned senior created a {type_label} request in AgeWell.",
    )
