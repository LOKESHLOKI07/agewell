"""Per-service operating rules from the EldCare checklists.

Personalised Diet Plan had no Responsible/Finisher on the source sheet.
Admin owns assign and close; photo is still required.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from fastapi import HTTPException, status

from app.modules.care.companion_services import is_service_companion_kind
from app.modules.care.models import (
    CARE_STAFF_KIND_CARE_MANAGER,
    CARE_STAFF_KIND_COMPANION,
    CARE_STAFF_KIND_DELIVERY_EXECUTIVE,
)
from app.modules.users.models import RoleEnum

ROLE_CARE_MANAGER = "CARE_MANAGER"
ROLE_COMPANION = "COMPANION"
ROLE_SERVICE_COMPANION = "SERVICE_COMPANION"
ROLE_ADMIN = "ADMIN"

PolicyRole = str


@dataclass(frozen=True)
class ServicePolicy:
    slug: str
    responsible: tuple[PolicyRole, ...]
    finishers: tuple[PolicyRole, ...]
    tracks_location: bool
    photo_required: bool


def _p(
    slug: str,
    responsible: tuple[PolicyRole, ...],
    finishers: tuple[PolicyRole, ...],
    *,
    tracks_location: bool = False,
    photo_required: bool = False,
) -> ServicePolicy:
    return ServicePolicy(
        slug=slug,
        responsible=responsible,
        finishers=finishers,
        tracks_location=tracks_location,
        photo_required=photo_required,
    )


SERVICE_POLICIES: dict[str, ServicePolicy] = {
    "emergency-sos": _p("emergency-sos", (ROLE_CARE_MANAGER, ROLE_COMPANION, ROLE_ADMIN), (ROLE_CARE_MANAGER, ROLE_ADMIN), tracks_location=True, photo_required=True),
    "care-manager": _p("care-manager", (ROLE_CARE_MANAGER, ROLE_ADMIN), (ROLE_CARE_MANAGER,)),
    "companion": _p("companion", (ROLE_CARE_MANAGER, ROLE_COMPANION), (ROLE_COMPANION,)),
    "medicine": _p("medicine", (ROLE_COMPANION, ROLE_SERVICE_COMPANION), (ROLE_SERVICE_COMPANION,), tracks_location=True, photo_required=True),
    "health-check": _p("health-check", (ROLE_CARE_MANAGER, ROLE_COMPANION), (ROLE_COMPANION,), photo_required=True),
    "monthly-blood-test": _p("monthly-blood-test", (ROLE_CARE_MANAGER, ROLE_COMPANION), (ROLE_COMPANION,), photo_required=True),
    "doctor": _p("doctor", (ROLE_CARE_MANAGER, ROLE_COMPANION), (ROLE_COMPANION,), photo_required=True),
    "personalised-diet-plan": _p("personalised-diet-plan", (ROLE_ADMIN,), (ROLE_ADMIN,), photo_required=True),
    "grocery": _p("grocery", (ROLE_COMPANION, ROLE_SERVICE_COMPANION), (ROLE_SERVICE_COMPANION,), tracks_location=True, photo_required=True),
    "small-errands": _p("small-errands", (ROLE_COMPANION, ROLE_SERVICE_COMPANION), (ROLE_SERVICE_COMPANION,)),
    "errand-coordination": _p("errand-coordination", (ROLE_COMPANION, ROLE_SERVICE_COMPANION), (ROLE_COMPANION, ROLE_SERVICE_COMPANION)),
    "banking-companion": _p("banking-companion", (ROLE_COMPANION, ROLE_SERVICE_COMPANION), (ROLE_COMPANION, ROLE_SERVICE_COMPANION)),
    "events-trips": _p("events-trips", (ROLE_ADMIN,), (ROLE_ADMIN,)),
    "cyber-security": _p("cyber-security", (ROLE_CARE_MANAGER, ROLE_ADMIN), (ROLE_CARE_MANAGER, ROLE_ADMIN)),
    "ca": _p("ca", (ROLE_ADMIN,), (ROLE_ADMIN,)),
    "legal": _p("legal", (ROLE_ADMIN,), (ROLE_ADMIN,)),
    "home-repair": _p("home-repair", (ROLE_CARE_MANAGER, ROLE_COMPANION, ROLE_ADMIN), (ROLE_COMPANION,), photo_required=True),
    "local-transport": _p("local-transport", (ROLE_CARE_MANAGER, ROLE_COMPANION, ROLE_ADMIN), (ROLE_COMPANION, ROLE_ADMIN), tracks_location=True),
    "transport": _p("transport", (ROLE_CARE_MANAGER, ROLE_COMPANION, ROLE_ADMIN), (ROLE_COMPANION, ROLE_ADMIN), tracks_location=True),
    "pooja": _p("pooja", (ROLE_CARE_MANAGER, ROLE_ADMIN), (ROLE_ADMIN,)),
    "cctv": _p("cctv", (ROLE_ADMIN,), (ROLE_ADMIN,)),
}


def get_service_policy(slug: str | None) -> ServicePolicy | None:
    if not slug:
        return None
    return SERVICE_POLICIES.get(slug.strip())


def tracks_location(slug: str | None) -> bool:
    policy = get_service_policy(slug)
    return bool(policy and policy.tracks_location)


def photo_required(slug: str | None) -> bool:
    policy = get_service_policy(slug)
    return bool(policy and policy.photo_required)


def policy_role_for_staff_kind(staff_kind: str | None) -> PolicyRole | None:
    kind = (staff_kind or "").strip().upper()
    if is_service_companion_kind(kind) or kind == CARE_STAFF_KIND_DELIVERY_EXECUTIVE:
        return ROLE_SERVICE_COMPANION
    if kind == CARE_STAFF_KIND_COMPANION:
        return ROLE_COMPANION
    if kind == CARE_STAFF_KIND_CARE_MANAGER or not kind:
        return ROLE_CARE_MANAGER
    return None


def policy_role_for_user(user, staff_kind: str | None = None) -> PolicyRole | None:
    role = getattr(user, "role", None)
    if role in (RoleEnum.ADMIN, RoleEnum.OPERATIONS):
        return ROLE_ADMIN
    if role == RoleEnum.CARE_MANAGER:
        return policy_role_for_staff_kind(staff_kind)
    return None


def can_assign(
    slug: str | None,
    assignee_role: PolicyRole | None,
    *,
    companion_service_slugs: Iterable[str] | None = None,
) -> bool:
    policy = get_service_policy(slug)
    if policy is None or assignee_role is None:
        return True
    if assignee_role not in policy.responsible:
        return False
    if assignee_role == ROLE_SERVICE_COMPANION:
        covered = {item for item in (companion_service_slugs or []) if item}
        if covered and slug not in covered:
            return False
    return True


def can_finish(slug: str | None, actor_role: PolicyRole | None) -> bool:
    policy = get_service_policy(slug)
    if policy is None or actor_role is None:
        return True
    return actor_role in policy.finishers


def ensure_can_assign(
    slug: str | None,
    assignee_role: PolicyRole | None,
    *,
    companion_service_slugs: Iterable[str] | None = None,
) -> None:
    if can_assign(slug, assignee_role, companion_service_slugs=companion_service_slugs):
        return
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="This person cannot be assigned to that service.",
    )


def ensure_can_finish(slug: str | None, actor_role: PolicyRole | None) -> None:
    if can_finish(slug, actor_role):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only the final finisher can close this service.",
    )


def infer_delivery_slug(title: str | None, stored: str | None = None) -> str | None:
    if stored:
        return stored
    key = (title or "").strip().lower()
    if "grocery" in key:
        return "grocery"
    if "medicine" in key or "pharmacy" in key:
        return "medicine"
    if "food" in key or "meal" in key:
        return None
    return None


DELIVERY_ASSIGN_SLUGS = {"grocery", "medicine"}
DESK_ONLY_SLUGS = {
    "personalised-diet-plan",
    "events-trips",
    "ca",
    "legal",
    "cctv",
    "pooja",
    "cyber-security",
    "emergency-sos",
}


def uses_delivery_job(slug: str | None) -> bool:
    return (slug or "") in DELIVERY_ASSIGN_SLUGS


def is_desk_only_service(slug: str | None) -> bool:
    return (slug or "") in DESK_ONLY_SLUGS


def needs_service_companion_dispatch(slug: str | None) -> bool:
    """Admin assigns Companion/CM first; they hand off to SC (or take when allowed)."""
    if is_desk_only_service(slug):
        return False
    policy = get_service_policy(slug)
    if policy is None:
        return False
    return ROLE_SERVICE_COMPANION in policy.responsible and ROLE_SERVICE_COMPANION in policy.finishers


def sc_is_sole_finisher(slug: str | None) -> bool:
    policy = get_service_policy(slug)
    if policy is None:
        return False
    return tuple(policy.finishers) == (ROLE_SERVICE_COMPANION,)


def allows_take_task(slug: str | None) -> bool:
    """Companion and Service Companion are both finishers (take or assign to SC)."""
    policy = get_service_policy(slug)
    if policy is None:
        return False
    return ROLE_COMPANION in policy.finishers and ROLE_SERVICE_COMPANION in policy.finishers


def should_auto_assign_standing(slug: str | None) -> bool:
    """Route to senior's standing CM/Companion when SC handoff is not required."""
    if is_desk_only_service(slug) or needs_service_companion_dispatch(slug):
        return False
    policy = get_service_policy(slug)
    if policy is None:
        return False
    return bool(set(policy.responsible) & {ROLE_CARE_MANAGER, ROLE_COMPANION})


def dispatch_mode_for(slug: str | None) -> str:
    """UI hint: none | assign_sc_only | take_or_assign."""
    if not needs_service_companion_dispatch(slug):
        return "none"
    if sc_is_sole_finisher(slug):
        return "assign_sc_only"
    if allows_take_task(slug):
        return "take_or_assign"
    return "assign_sc_only"


def ensure_proof_photo(slug: str | None, photo: str | None) -> None:
    if not photo_required(slug):
        return
    if photo and str(photo).strip():
        return
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="A proof photo is required to complete this service.",
    )
