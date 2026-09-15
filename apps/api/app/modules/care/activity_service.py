from datetime import date, datetime, timezone
from typing import Optional
from uuid import UUID
import json

from fastapi import HTTPException, status

from app.api.schemas import ListPage
from app.core.timezone import APP_TIMEZONE
from app.modules.audit.repository import AuditRepository
from app.modules.care.booking import (
    CALL_HOURS_MESSAGE,
    is_care_manager_call_open,
    is_visit_slot_bookable,
    list_visit_slots,
)
from app.modules.care.models import (
    CareActivityStatus,
    CareActivityType,
    CareManager,
    CareManagerActivity,
    icon_for_activity_type,
    title_for_activity_type,
)
from app.modules.care.repository import CareManagerRepository
from app.modules.care.schemas import (
    AssignedCareManager,
    AssignedCareManagerResponse,
    CareActivityResponse,
    CareActivityUpdate,
    CareVisitSlot,
    CareVisitSlotsResponse,
    care_manager_display_name,
)
from app.modules.notifications.models import NotificationPriority
from app.modules.notifications.repository import NotificationRepository
from app.modules.seniors.repository import SeniorRepository
from app.modules.seniors.service_area import resolve_in_service_area
from app.modules.users.models import RoleEnum, User
from app.modules.visits.models import Visit, VisitStatus


NOT_ASSIGNED = "A Care Manager has not been assigned yet."
FORBIDDEN = "You don't have permission to access this information."


def _iso(value: Optional[datetime]) -> Optional[str]:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.isoformat()


def _parse_dt(value: Optional[str], *, field: str) -> Optional[datetime]:
    if value is None or not str(value).strip():
        return None
    raw = str(value).strip().replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(raw)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid {field}") from exc
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=APP_TIMEZONE)
    return parsed.astimezone(timezone.utc)


def _parse_type(value: Optional[str]) -> CareActivityType:
    if not value:
        return CareActivityType.GENERAL
    try:
        return CareActivityType(str(value).strip().upper())
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid activity type") from exc


def _parse_status(value: Optional[str]) -> CareActivityStatus:
    if not value:
        return CareActivityStatus.REQUESTED
    try:
        return CareActivityStatus(str(value).strip().upper())
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid activity status") from exc


def to_activity_response(row: CareManagerActivity, care_manager: Optional[CareManager]) -> CareActivityResponse:
    typed = _parse_type(row.activity_type)
    return CareActivityResponse(
        id=row.id,
        senior_id=row.senior_id,
        care_manager_id=row.care_manager_id,
        care_manager_name=care_manager_display_name(care_manager.first_name, care_manager.last_name) if care_manager else None,
        activity_type=typed.value,
        status=row.status,
        icon=row.icon or icon_for_activity_type(typed),
        title=title_for_activity_type(typed),
        occurred_at=_iso(row.occurred_at),
        scheduled_at=_iso(row.scheduled_at),
        reason=row.reason,
        discussion=row.discussion,
        action_taken=row.action_taken,
        services_coordinated=row.services_coordinated,
        follow_up_required=bool(row.follow_up_required),
        follow_up_date=_iso(row.follow_up_date),
        follow_up_notes=row.follow_up_notes,
        notes=row.notes,
        visit_id=row.visit_id,
        created_at=_iso(row.created_at),
    )


class CareActivityService:
    def __init__(
        self,
        repo: CareManagerRepository,
        senior_repo: SeniorRepository,
        access_repo,
        notification_repo: Optional[NotificationRepository] = None,
        audit_repo: Optional[AuditRepository] = None,
    ):
        self.repo = repo
        self.senior_repo = senior_repo
        self.access_repo = access_repo
        self.notification_repo = notification_repo
        self.audit_repo = audit_repo

    async def resolve_customer_senior_id(self, user: User, requested_senior_id: Optional[UUID] = None) -> UUID:
        if user.role == RoleEnum.SENIOR:
            senior = await self.senior_repo.get_by_user_id(user.id)
            if not senior:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Senior profile not found")
            if requested_senior_id and requested_senior_id != senior.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
            return senior.id

        if user.role == RoleEnum.FAMILY:
            family = await self.access_repo.get_family_member_by_user_id(user.id)
            if not family:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
            senior_ids = await self.access_repo.list_family_senior_ids(family.id)
            if requested_senior_id:
                if requested_senior_id not in senior_ids:
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
                return requested_senior_id
            if not senior_ids:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Senior profile not found")
            return senior_ids[0]

        if user.role in (RoleEnum.ADMIN, RoleEnum.OPERATIONS, RoleEnum.CARE_MANAGER):
            if not requested_senior_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="senior_id is required")
            senior = await self.senior_repo.get_by_id(requested_senior_id)
            if not senior:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Senior not found")
            if user.role == RoleEnum.CARE_MANAGER:
                care = await self.repo.get_by_user_id(user.id)
                if not care or not await self.access_repo.care_manager_has_assigned_visit_for_senior(care.id, senior.id):
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
            return senior.id

        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)

    async def get_assigned(
        self,
        user: User,
        requested_senior_id: Optional[UUID] = None,
        staff_kind: Optional[str] = None,
    ) -> AssignedCareManagerResponse:
        from app.modules.care.models import CARE_STAFF_KIND_CARE_MANAGER
        from app.modules.care.service import normalize_staff_kind

        kind = normalize_staff_kind(staff_kind, default=CARE_STAFF_KIND_CARE_MANAGER)
        try:
            senior_id = await self.resolve_customer_senior_id(user, requested_senior_id)
        except HTTPException as exc:
            if user.role == RoleEnum.FAMILY and exc.status_code in (403, 404):
                return AssignedCareManagerResponse(assigned=False, in_service_area=False, senior_id=None, care_manager=None)
            raise
        senior = await self.senior_repo.get_by_id(senior_id)
        if not senior:
            return AssignedCareManagerResponse(assigned=False, in_service_area=False, senior_id=None, care_manager=None)
        care = await self.repo.get_assigned_for_senior(senior_id, staff_kind=kind)
        if not care:
            return AssignedCareManagerResponse(
                assigned=False,
                in_service_area=resolve_in_service_area(senior),
                senior_id=senior_id,
                care_manager=None,
            )
        phone = await self.repo.get_user_phone(care.user_id)
        return AssignedCareManagerResponse(
            assigned=True,
            in_service_area=resolve_in_service_area(senior),
            senior_id=senior_id,
            care_manager=AssignedCareManager(
                id=care.id,
                user_id=care.user_id,
                employee_id=care.employee_id,
                name=care_manager_display_name(care.first_name, care.last_name),
                first_name=care.first_name,
                last_name=care.last_name,
                phone=phone,
                skills=care.skills,
                experience=care.experience,
                languages=care.languages,
                availability=care.availability,
                status=care.status,
                staff_kind=care.staff_kind,
            ),
        )

    async def visit_slots(self, user: User, on_date: date, requested_senior_id: Optional[UUID] = None) -> CareVisitSlotsResponse:
        await self.resolve_customer_senior_id(user, requested_senior_id)
        slots = list_visit_slots(on_date)
        return CareVisitSlotsResponse(
            date=on_date.isoformat(),
            slots=[
                CareVisitSlot(
                    start_at=slot.isoformat(),
                    label=slot.strftime("%I:%M %p").lstrip("0"),
                )
                for slot in slots
            ],
        )

    async def list_activities(
        self,
        user: User,
        *,
        senior_id: Optional[UUID] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> ListPage[CareActivityResponse]:
        scoped_senior_id = None
        scoped_senior_ids = None
        care_manager_id = None
        if user.role == RoleEnum.SENIOR:
            scoped_senior_id = await self.resolve_customer_senior_id(user, senior_id)
        elif user.role == RoleEnum.FAMILY:
            family = await self.access_repo.get_family_member_by_user_id(user.id)
            if not family:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
            if senior_id:
                scoped_senior_id = await self.resolve_customer_senior_id(user, senior_id)
            else:
                scoped_senior_ids = await self.access_repo.list_family_senior_ids(family.id)
        elif user.role == RoleEnum.CARE_MANAGER:
            care = await self.repo.get_by_user_id(user.id)
            if not care:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
            care_manager_id = care.id
            if senior_id:
                if not await self.access_repo.care_manager_has_assigned_visit_for_senior(care.id, senior_id):
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
                scoped_senior_id = senior_id
        elif user.role in (RoleEnum.ADMIN, RoleEnum.OPERATIONS):
            scoped_senior_id = senior_id
        else:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)

        rows, total = await self.repo.list_activities(
            senior_id=scoped_senior_id,
            senior_ids=scoped_senior_ids,
            care_manager_id=care_manager_id,
            limit=limit,
            offset=offset,
        )
        return ListPage(
            items=[to_activity_response(row, care) for row, care in rows],
            total=total,
            limit=limit,
            offset=offset,
        )

    async def create_call(self, user: User, requested_senior_id: Optional[UUID] = None) -> CareActivityResponse:
        if not is_care_manager_call_open():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=CALL_HOURS_MESSAGE)
        return await self._create_request(user, CareActivityType.CALL, requested_senior_id)

    async def create_message(self, user: User, requested_senior_id: Optional[UUID] = None) -> CareActivityResponse:
        return await self._create_request(user, CareActivityType.MESSAGE, requested_senior_id)

    async def create_visit(
        self,
        user: User,
        scheduled_at: str,
        reason: Optional[str] = None,
        requested_senior_id: Optional[UUID] = None,
    ) -> CareActivityResponse:
        slot = _parse_dt(scheduled_at, field="scheduled_at")
        if slot is None or not is_visit_slot_bookable(slot):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="That visit slot is not available. Please choose another date or time.",
            )
        return await self._create_request(
            user,
            CareActivityType.VISIT,
            requested_senior_id,
            scheduled_at=slot,
            reason=reason,
            activity_status=CareActivityStatus.SCHEDULED,
        )

    async def update_activity(self, user: User, activity_id: UUID, payload: CareActivityUpdate) -> CareActivityResponse:
        found = await self.repo.get_activity(activity_id)
        if not found:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
        row, care = found
        if user.role == RoleEnum.CARE_MANAGER:
            profile = await self.repo.get_by_user_id(user.id)
            if not profile or row.care_manager_id != profile.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
        elif user.role not in (RoleEnum.ADMIN, RoleEnum.OPERATIONS):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)

        data = payload.model_dump(exclude_unset=True)
        if "activity_type" in data:
            typed = _parse_type(data.pop("activity_type"))
            row.activity_type = typed.value
            row.icon = icon_for_activity_type(typed)
        if "status" in data:
            row.status = _parse_status(data.pop("status")).value
        for key in ("occurred_at", "scheduled_at", "follow_up_date"):
            if key in data:
                setattr(row, key, _parse_dt(data.pop(key), field=key))
        for key, value in data.items():
            if isinstance(value, str):
                value = value.strip() or None
            setattr(row, key, value)
        if not row.icon:
            row.icon = icon_for_activity_type(row.activity_type)

        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="care_manager_activities",
                entity_id=str(row.id),
                action="UPDATE",
                changes=json.dumps(payload.model_dump(exclude_unset=True), default=str),
            )
        await self.repo.session.commit()
        refreshed = await self.repo.get_activity(row.id)
        row, care = refreshed if refreshed else (row, care)
        return to_activity_response(row, care)

    async def _create_request(
        self,
        user: User,
        activity_type: CareActivityType,
        requested_senior_id: Optional[UUID],
        *,
        scheduled_at: Optional[datetime] = None,
        reason: Optional[str] = None,
        activity_status: CareActivityStatus = CareActivityStatus.REQUESTED,
    ) -> CareActivityResponse:
        senior_id = await self.resolve_customer_senior_id(user, requested_senior_id)
        care = await self.repo.get_assigned_for_senior(senior_id)
        if not care:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=NOT_ASSIGNED)

        now = datetime.now(timezone.utc)
        visit_id = None
        if activity_type == CareActivityType.VISIT and scheduled_at is not None:
            visit = Visit(
                senior_id=senior_id,
                care_manager_id=care.id,
                status=VisitStatus.SCHEDULED,
                scheduled_at=scheduled_at,
                notes=(reason or "").strip() or None,
            )
            self.repo.session.add(visit)
            await self.repo.session.flush()
            visit_id = visit.id

        row = CareManagerActivity(
            senior_id=senior_id,
            care_manager_id=care.id,
            activity_type=activity_type.value,
            status=activity_status.value,
            icon=icon_for_activity_type(activity_type),
            occurred_at=scheduled_at or now,
            scheduled_at=scheduled_at,
            reason=(reason or "").strip() or None,
            visit_id=visit_id,
        )
        row = await self.repo.add_activity(row)
        await self._notify_ops(senior_id, care, activity_type, reason)
        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="care_manager_activities",
                entity_id=str(row.id),
                action="CREATE",
                changes=json.dumps({"type": activity_type.value, "senior_id": str(senior_id)}),
            )
        await self.repo.session.commit()
        await self.repo.session.refresh(row)
        return to_activity_response(row, care)

    async def _notify_ops(
        self,
        senior_id: UUID,
        care: CareManager,
        activity_type: CareActivityType,
        reason: Optional[str],
    ) -> None:
        if not self.notification_repo:
            return
        senior = await self.senior_repo.get_by_id(senior_id)
        senior_name = " ".join(part for part in (getattr(senior, "first_name", None), getattr(senior, "last_name", None)) if part).strip() or "Customer"
        title = title_for_activity_type(activity_type)
        message = f"{title} from {senior_name}."
        if reason:
            message = f"{message} {reason.strip()}"
        user_ids = set(await self.access_repo.list_ops_user_ids())
        if care.user_id:
            user_ids.add(care.user_id)
        for user_id in user_ids:
            await self.notification_repo.create(
                user_id=user_id,
                title=title,
                message=message,
                priority=NotificationPriority.IMPORTANT,
            )
