from datetime import datetime, timedelta, timezone
from typing import Optional, Sequence
from uuid import UUID
import json

from fastapi import HTTPException, status
from sqlalchemy import select

from app.api.schemas import ListPage
from app.core.config import settings
from app.modules.access.repository import AccessRepository
from app.modules.audit.repository import AuditRepository
from app.modules.care.models import CARE_STAFF_KIND_CARE_MANAGER, CARE_STAFF_KIND_COMPANION, CareManager
from app.modules.emergency.models import (
    EmergencyCase,
    EmergencyRecipient,
    EmergencyStatus,
    EmergencyType,
    RECIPIENT_AGEWELL_SUPPORT,
    RECIPIENT_CARE_MANAGER,
    RECIPIENT_COMPANION,
    RECIPIENT_FAMILY,
    RECIPIENT_LABELS,
    RECIPIENT_RESPONDED,
    RECIPIENT_ROLES,
    TRIGGER_APP_SOS,
    TRIGGER_SOURCES,
)

# Immediate notify on SOS create.
FIRST_RESPONSE_ROLES = (RECIPIENT_FAMILY, RECIPIENT_COMPANION)
from app.modules.emergency.repository import EmergencyRepository
from app.modules.emergency.schemas import (
    EmergencyCaseResponse,
    EmergencyCreate,
    EmergencyEventResponse,
    EmergencyRecipientResponse,
    EmergencyReportUpdate,
    FirstResponseStatus,
)

FIRST_RESPONSE_SENT = "SENT"
FIRST_RESPONSE_NO_CONTACT = "NO_CONTACT"
FIRST_RESPONSE_FAILED = "FAILED"
from app.modules.families.models import FamilyMember
from app.modules.memberships.repository import MembershipRepository
from app.modules.memberships.service import compute_membership_status
from app.modules.notifications.emergency_copy import (
    care_manager_emergency_copy,
    companion_emergency_copy,
    emergency_type_label,
    family_emergency_copy,
    senior_display_name,
    senior_emergency_copy,
    support_emergency_copy,
    trigger_source_label,
)
from app.modules.notifications.models import NotificationPriority
from app.modules.notifications.repository import NotificationRepository
from app.modules.seniors.models import Senior
from app.modules.seniors.repository import SeniorRepository
from app.modules.seniors.service_area import resolve_in_service_area
from app.modules.users.models import RoleEnum, User


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _location_text(senior: Senior) -> Optional[str]:
    # TODO(Emergency Current Location): keep this as a static address /
    # preferred-hospital snapshot. Do not attach live phone GPS here until the
    # dedicated background-location design (Android/iOS permission + privacy)
    # is implemented separately.
    parts: list[str] = []
    for value in (senior.address, senior.location_query):
        if value and str(value).strip():
            parts.append(str(value).strip())
            break
    hospital = getattr(senior, "preferred_hospital", None)
    if hospital and str(hospital).strip():
        parts.append(f"Preferred hospital: {str(hospital).strip()}")
    return " · ".join(parts) if parts else None


def _sorted_recipients(recipients: Sequence[EmergencyRecipient]) -> list[EmergencyRecipient]:
    order = {role: index for index, role in enumerate(RECIPIENT_ROLES)}
    return sorted(list(recipients), key=lambda row: order.get(row.role, 99))


class EmergencyService:
    def __init__(
        self,
        repo: EmergencyRepository,
        notification_repo: NotificationRepository,
        access_repo: AccessRepository,
        senior_repo: SeniorRepository,
        audit_repo: Optional[AuditRepository] = None,
        membership_repo: Optional[MembershipRepository] = None,
    ):
        self.repo = repo
        self.notification_repo = notification_repo
        self.access_repo = access_repo
        self.senior_repo = senior_repo
        self.audit_repo = audit_repo
        self.membership_repo = membership_repo

    async def _handled_by_name(self, user_id: Optional[UUID]) -> Optional[str]:
        if not user_id:
            return None
        session = self.repo.session
        care = (
            await session.execute(select(CareManager).where(CareManager.user_id == user_id))
        ).scalars().first()
        if care:
            name = senior_display_name(care.first_name, care.last_name)
            return None if name == "the senior" else name
        family = (
            await session.execute(select(FamilyMember).where(FamilyMember.user_id == user_id))
        ).scalars().first()
        if family:
            name = senior_display_name(family.first_name, family.last_name)
            return None if name == "the senior" else name
        user = (await session.execute(select(User).where(User.id == user_id))).scalars().first()
        return user.email if user else None

    async def to_case_response(self, case: EmergencyCase) -> EmergencyCaseResponse:
        if case.senior_id is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Emergency case is missing senior_id",
            )
        senior = await self.senior_repo.get_by_id(case.senior_id)
        senior_name = senior_display_name(senior.first_name, senior.last_name) if senior else None
        if senior_name == "the senior":
            senior_name = None
        recipients = [
            EmergencyRecipientResponse(
                id=row.id,
                role=row.role,
                label=RECIPIENT_LABELS.get(row.role, row.role.replace("_", " ").title()),
                status=row.status,
                notified_at=row.notified_at,
                responded_at=row.responded_at,
            )
            for row in _sorted_recipients(case.recipients or [])
        ]
        return EmergencyCaseResponse(
            id=case.id,
            senior_id=case.senior_id,
            senior_name=senior_name,
            type=case.type,
            status=case.status,
            created_at=case.created_at,
            case_number=case.case_number,
            trigger_source=case.trigger_source,
            location_text=case.location_text,
            triggered_at=case.triggered_at,
            alert_sent_at=case.alert_sent_at,
            assistance_started_at=case.assistance_started_at,
            resolved_at=case.resolved_at,
            closed_at=case.closed_at,
            handled_by_name=await self._handled_by_name(case.handled_by_user_id),
            emergency_reason=case.emergency_reason,
            what_happened=case.what_happened,
            action_taken=case.action_taken,
            hospital_required=case.hospital_required,
            hospital_details=case.hospital_details,
            family_communication=case.family_communication,
            notes=case.notes,
            follow_up_required=case.follow_up_required,
            follow_up_date=case.follow_up_date,
            recipients=recipients,
        )

    async def list_cases(
        self,
        *,
        senior_id: Optional[UUID] = None,
        assigned_senior_ids: Optional[Sequence[UUID]] = None,
        status: Optional[EmergencyStatus] = None,
        emergency_type: Optional[EmergencyType] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> ListPage[EmergencyCaseResponse]:
        rows, total = await self.repo.list_cases(
            senior_id=senior_id,
            assigned_senior_ids=assigned_senior_ids,
            status=status,
            emergency_type=emergency_type,
            limit=limit,
            offset=offset,
        )
        return ListPage(
            items=[await self.to_case_response(row) for row in rows],
            total=total,
            limit=limit,
            offset=offset,
        )

    async def get_case(self, case_id: UUID) -> EmergencyCase:
        case = await self.repo.get_case_by_id(case_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency case not found")
        return case

    async def list_events(
        self,
        case_id: UUID,
        *,
        limit: int = 50,
        offset: int = 0,
    ) -> ListPage[EmergencyEventResponse]:
        rows, total = await self.repo.list_events(case_id, limit=limit, offset=offset)
        return ListPage(
            items=[EmergencyEventResponse.model_validate(row) for row in rows],
            total=total,
            limit=limit,
            offset=offset,
        )

    async def _ensure_active_membership(self, senior_id: UUID, actor: User) -> None:
        if actor.role in (RoleEnum.ADMIN, RoleEnum.OPERATIONS):
            return
        if not self.membership_repo:
            return
        rows = await self.membership_repo.list_memberships_for_senior(senior_id)
        for membership, _plan in rows:
            if compute_membership_status(membership.start_date, membership.end_date) == "ACTIVE":
                return
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active membership is required for Emergency Support.",
        )

    async def _ensure_service_area(self, senior: Senior, actor: User) -> None:
        if actor.role in (RoleEnum.ADMIN, RoleEnum.OPERATIONS, RoleEnum.CARE_MANAGER):
            return
        if resolve_in_service_area(senior):
            return
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Emergency Support is not available in this service area yet.",
        )

    async def create_case(self, payload: EmergencyCreate, senior_id: UUID, actor: User) -> EmergencyCaseResponse:
        await self._ensure_active_membership(senior_id, actor)
        trigger = (payload.trigger_source or TRIGGER_APP_SOS).upper()
        if trigger not in TRIGGER_SOURCES:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid trigger source.")

        senior = await self.senior_repo.get_by_id(senior_id)
        if not senior:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Senior not found")
        await self._ensure_service_area(senior, actor)

        active = await self.repo.get_active_case_for_senior(senior_id)
        if active:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An emergency case is already active.",
            )

        now = _now()
        delay = float(getattr(settings, "SOS_FIRST_RESPONSE_ESCALATION_SECONDS", 30.0) or 0.0)
        case = await self.repo.create_case(
            senior_id=senior_id,
            emergency_type=payload.type,
            trigger_source=trigger,
            location_text=_location_text(senior),
        )
        case.escalation_due_at = now + timedelta(seconds=max(delay, 0.0))
        recipients_by_role: dict[str, EmergencyRecipient] = {}
        for role in RECIPIENT_ROLES:
            # Stamp notified_at only after a durable in-app notification row exists.
            recipients_by_role[role] = await self.repo.add_recipient(
                case_id=case.id, role=role, notified_at=None
            )

        push_recipients, first_response = await self._dispatch_first_response(
            case=case,
            senior=senior,
            recipients_by_role=recipients_by_role,
            now=now,
        )
        if first_response.family == FIRST_RESPONSE_SENT or first_response.companion == FIRST_RESPONSE_SENT:
            case.alert_sent_at = now
        await self.repo.add_event(
            case_id=case.id,
            event_description=self._first_response_event_description(trigger, first_response),
        )
        await self.repo.session.commit()
        from app.modules.emergency.escalation import schedule_care_manager_escalation
        from app.modules.notifications.push import ExpoPushSender
        from app.modules.notifications.repository import DevicePushTokenRepository

        # OS push after commit so a failed push never rolls back the case.
        await ExpoPushSender(DevicePushTokenRepository(self.repo.session)).send_messages_for_recipients(
            recipients=push_recipients,
            emergency_id=case.id,
        )
        schedule_care_manager_escalation(case.id)
        case = await self.get_case(case.id)
        response = await self.to_case_response(case)
        response.first_response = first_response
        return response

    async def update_status(
        self, case_id: UUID, new_status: EmergencyStatus, actor: Optional[User] = None
    ) -> EmergencyCaseResponse:
        case = await self.get_case(case_id)
        previous = case.status
        now = _now()
        case.status = new_status
        if new_status == EmergencyStatus.IN_PROGRESS and case.assistance_started_at is None:
            case.assistance_started_at = now
        if new_status == EmergencyStatus.RESOLVED and case.resolved_at is None:
            case.resolved_at = now
            if actor:
                case.handled_by_user_id = actor.id
        if new_status == EmergencyStatus.CANCELLED and case.closed_at is None:
            case.closed_at = now
        await self.repo.add_event(
            case_id=case.id,
            event_description=f"Status changed to {new_status.value}.",
        )
        await self.repo.save_case(case)
        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="emergency_cases",
                entity_id=str(case.id),
                action="UPDATE",
                changes=json.dumps({"from": previous.value if previous else None, "to": new_status.value}),
            )
            await self.repo.session.commit()
        case = await self.get_case(case.id)
        return await self.to_case_response(case)

    async def recipient_role_for_user(self, user: User) -> Optional[str]:
        if user.role == RoleEnum.FAMILY:
            return RECIPIENT_FAMILY
        if user.role in (RoleEnum.ADMIN, RoleEnum.OPERATIONS):
            return RECIPIENT_AGEWELL_SUPPORT
        if user.role == RoleEnum.CARE_MANAGER:
            care = await self.access_repo.get_care_manager_by_user_id(user.id)
            kind = (care.staff_kind if care else None) or CARE_STAFF_KIND_CARE_MANAGER
            if kind == CARE_STAFF_KIND_COMPANION:
                return RECIPIENT_COMPANION
            if kind == CARE_STAFF_KIND_CARE_MANAGER:
                return RECIPIENT_CARE_MANAGER
            return None
        return None

    def _recipient_for_role(self, case: EmergencyCase, role: str) -> Optional[EmergencyRecipient]:
        for row in case.recipients or []:
            if row.role == role:
                return row
        return None

    async def acknowledge(self, case_id: UUID, actor: User) -> EmergencyCaseResponse:
        case = await self.get_case(case_id)
        role = await self.recipient_role_for_user(actor)
        if not role:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot respond to this alert.")
        recipient = self._recipient_for_role(case, role)
        if not recipient:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipient not found on this case.")
        now = _now()
        if recipient.status != RECIPIENT_RESPONDED:
            recipient.status = RECIPIENT_RESPONDED
            recipient.responded_at = now
            recipient.responded_by_user_id = actor.id
            if recipient.notified_at is None:
                recipient.notified_at = now
            label = RECIPIENT_LABELS.get(role, role)
            await self.repo.add_event(case_id=case.id, event_description=f"{label} responded.")
            if role in (RECIPIENT_CARE_MANAGER, RECIPIENT_COMPANION, RECIPIENT_AGEWELL_SUPPORT):
                if case.assistance_started_at is None:
                    case.assistance_started_at = now
                if case.status in (EmergencyStatus.OPEN, EmergencyStatus.ACKNOWLEDGED, EmergencyStatus.ASSIGNED):
                    case.status = EmergencyStatus.IN_PROGRESS
            elif case.status == EmergencyStatus.OPEN:
                case.status = EmergencyStatus.ACKNOWLEDGED
        await self.repo.save_case(case)
        case = await self.get_case(case.id)
        return await self.to_case_response(case)

    async def update_report(
        self, case_id: UUID, payload: EmergencyReportUpdate, actor: User
    ) -> EmergencyCaseResponse:
        case = await self.get_case(case_id)
        now = _now()
        fields = payload.model_dump(exclude={"mark_resolved", "mark_closed"}, exclude_unset=True)
        for key, value in fields.items():
            setattr(case, key, value)
        if payload.mark_resolved or payload.mark_closed:
            case.handled_by_user_id = actor.id
        if payload.mark_resolved:
            if case.assistance_started_at is None:
                case.assistance_started_at = now
            case.resolved_at = case.resolved_at or now
            case.status = EmergencyStatus.RESOLVED
            await self.repo.add_event(case_id=case.id, event_description="Emergency resolved. Final report on file.")
        if payload.mark_closed:
            case.closed_at = case.closed_at or now
            if case.status != EmergencyStatus.CANCELLED:
                case.status = EmergencyStatus.RESOLVED
            await self.repo.add_event(case_id=case.id, event_description="Emergency case closed.")
        if not payload.mark_resolved and not payload.mark_closed:
            await self.repo.add_event(case_id=case.id, event_description="Emergency handling details updated.")
            if case.status in (EmergencyStatus.OPEN, EmergencyStatus.ACKNOWLEDGED, EmergencyStatus.ASSIGNED):
                case.status = EmergencyStatus.IN_PROGRESS
                if case.assistance_started_at is None:
                    case.assistance_started_at = now
        await self.repo.save_case(case)
        case = await self.get_case(case.id)
        return await self.to_case_response(case)

    def _first_response_acknowledged(self, case: EmergencyCase) -> bool:
        for row in case.recipients or []:
            if row.role in FIRST_RESPONSE_ROLES and row.status == RECIPIENT_RESPONDED:
                return True
        return False

    async def escalate_if_needed(self, case_id: UUID) -> EmergencyCaseResponse | None:
        """Notify Care Manager / Support if Family+Companion have not acknowledged."""
        case = await self.repo.get_case_by_id(case_id)
        if not case:
            return None
        if case.status in (EmergencyStatus.RESOLVED, EmergencyStatus.CANCELLED):
            return await self.to_case_response(case)
        if self._first_response_acknowledged(case):
            await self.repo.add_event(
                case_id=case.id,
                event_description="Escalation skipped — Family or Companion already acknowledged.",
            )
            await self.repo.session.commit()
            return await self.to_case_response(await self.get_case(case.id))

        cm = self._recipient_for_role(case, RECIPIENT_CARE_MANAGER)
        support = self._recipient_for_role(case, RECIPIENT_AGEWELL_SUPPORT)
        already_escalated = bool(
            (cm and cm.notified_at) or (support and support.notified_at)
        )
        if already_escalated:
            return await self.to_case_response(case)

        senior = await self.senior_repo.get_by_id(case.senior_id) if case.senior_id else None
        if not senior:
            return await self.to_case_response(case)

        now = _now()
        if cm and cm.notified_at is None:
            cm.notified_at = now
        if support and support.notified_at is None:
            support.notified_at = now

        push_recipients = await self._fanout_escalation_notifications(case, senior)
        await self.repo.add_event(
            case_id=case.id,
            event_description=(
                "Escalated to Care Manager and AgeWell Support — "
                "no Family/Companion acknowledgement within the first-response window."
            ),
        )
        await self.repo.session.commit()
        from app.modules.notifications.push import ExpoPushSender
        from app.modules.notifications.repository import DevicePushTokenRepository

        await ExpoPushSender(DevicePushTokenRepository(self.repo.session)).send_messages_for_recipients(
            recipients=push_recipients,
            emergency_id=case.id,
        )
        return await self.to_case_response(await self.get_case(case.id))

    async def _notify_users(self, recipients: list[tuple[UUID, str, str]]) -> list[tuple[UUID, str, str]]:
        seen: set[UUID] = set()
        unique: list[tuple[UUID, str, str]] = []
        for user_id, title, message in recipients:
            if user_id in seen:
                continue
            seen.add(user_id)
            unique.append((user_id, title, message))
            await self.notification_repo.create(
                user_id=user_id,
                title=title,
                message=message,
                priority=NotificationPriority.EMERGENCY,
            )
        return unique

    def _first_response_event_description(self, trigger: str, first_response: FirstResponseStatus) -> str:
        parts: list[str] = []
        if first_response.family == FIRST_RESPONSE_SENT:
            parts.append("Family Member")
        if first_response.companion == FIRST_RESPONSE_SENT:
            parts.append("Companion")
        if parts:
            who = " and ".join(parts)
            return (
                f"Alert sent to {who} ({trigger_source_label(trigger)}). "
                "Care Manager stands by for escalation."
            )
        return (
            f"Emergency opened ({trigger_source_label(trigger)}); "
            "Family/Companion notify incomplete. Care Manager stands by for escalation."
        )

    async def _dispatch_first_response(
        self,
        *,
        case: EmergencyCase,
        senior: Senior,
        recipients_by_role: dict[str, EmergencyRecipient],
        now: datetime,
    ) -> tuple[list[tuple[UUID, str, str]], FirstResponseStatus]:
        """Create durable in-app alerts for Family + Companion. Expo push stays after commit."""
        type_label = emergency_type_label(case.type)
        first_name = senior.first_name
        push_recipients: list[tuple[UUID, str, str]] = []

        if senior.user_id:
            title, message = senior_emergency_copy(type_label)
            push_recipients.extend(await self._notify_users([(senior.user_id, title, message)]))

        family_ids = await self.access_repo.list_family_user_ids_for_senior(senior.id)
        if not family_ids:
            family_status = FIRST_RESPONSE_NO_CONTACT
        else:
            try:
                rows = [
                    (user_id, *family_emergency_copy(first_name, type_label)) for user_id in family_ids
                ]
                notified = await self._notify_users(rows)
                if notified:
                    family_status = FIRST_RESPONSE_SENT
                    recipients_by_role[RECIPIENT_FAMILY].notified_at = now
                    push_recipients.extend(notified)
                else:
                    family_status = FIRST_RESPONSE_FAILED
            except Exception:
                family_status = FIRST_RESPONSE_FAILED

        companion_ids = await self.access_repo.list_assigned_staff_user_ids_for_senior(
            senior.id, CARE_STAFF_KIND_COMPANION
        )
        if not companion_ids:
            companion_status = FIRST_RESPONSE_NO_CONTACT
        else:
            try:
                rows = [
                    (user_id, *companion_emergency_copy(first_name)) for user_id in companion_ids
                ]
                notified = await self._notify_users(rows)
                if notified:
                    companion_status = FIRST_RESPONSE_SENT
                    recipients_by_role[RECIPIENT_COMPANION].notified_at = now
                    push_recipients.extend(notified)
                else:
                    companion_status = FIRST_RESPONSE_FAILED
            except Exception:
                companion_status = FIRST_RESPONSE_FAILED

        return push_recipients, FirstResponseStatus(family=family_status, companion=companion_status)

    async def _fanout_escalation_notifications(
        self, case: EmergencyCase, senior: Senior
    ) -> list[tuple[UUID, str, str]]:
        type_label = emergency_type_label(case.type)
        first_name = senior.first_name
        recipients: list[tuple[UUID, str, str]] = []

        for user_id in await self.access_repo.list_assigned_staff_user_ids_for_senior(
            senior.id, CARE_STAFF_KIND_CARE_MANAGER
        ):
            title, message = care_manager_emergency_copy(type_label)
            recipients.append((user_id, title, message))

        for user_id in await self.access_repo.list_ops_user_ids():
            title, message = support_emergency_copy(first_name)
            recipients.append((user_id, title, message))

        return await self._notify_users(recipients)


def to_case_response(case: EmergencyCase) -> EmergencyCaseResponse:
    """Legacy helper used by older call sites; prefer EmergencyService.to_case_response."""
    if case.senior_id is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Emergency case is missing senior_id")
    return EmergencyCaseResponse.model_validate(case)
