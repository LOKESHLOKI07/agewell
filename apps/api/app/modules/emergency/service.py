from typing import Optional, Sequence
from uuid import UUID
import json

from fastapi import HTTPException, status

from app.api.schemas import ListPage
from app.modules.access.repository import AccessRepository
from app.modules.audit.repository import AuditRepository
from app.modules.emergency.models import EmergencyCase, EmergencyStatus, EmergencyType
from app.modules.emergency.repository import EmergencyRepository
from app.modules.emergency.schemas import EmergencyCaseResponse, EmergencyCreate, EmergencyEventResponse
from app.modules.notifications.emergency_copy import (
    care_manager_emergency_copy,
    emergency_type_label,
    family_emergency_copy,
    senior_emergency_copy,
)
from app.modules.notifications.models import NotificationPriority
from app.modules.notifications.repository import NotificationRepository
from app.modules.seniors.repository import SeniorRepository


def to_case_response(case: EmergencyCase) -> EmergencyCaseResponse:
    if case.senior_id is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Emergency case is missing senior_id")
    return EmergencyCaseResponse.model_validate(case)


class EmergencyService:
    def __init__(
        self,
        repo: EmergencyRepository,
        notification_repo: NotificationRepository,
        access_repo: AccessRepository,
        senior_repo: SeniorRepository,
        audit_repo: Optional[AuditRepository] = None,
    ):
        self.repo = repo
        self.notification_repo = notification_repo
        self.access_repo = access_repo
        self.senior_repo = senior_repo
        self.audit_repo = audit_repo

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
            items=[to_case_response(row) for row in rows],
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

    async def create_case(self, payload: EmergencyCreate, senior_id: UUID) -> EmergencyCaseResponse:
        case = await self.repo.create_case(senior_id=senior_id, emergency_type=payload.type)
        await self._fanout_emergency_notifications(case)
        await self.repo.session.commit()
        await self.repo.session.refresh(case)
        return to_case_response(case)

    async def update_status(self, case_id: UUID, new_status: EmergencyStatus) -> EmergencyCaseResponse:
        case = await self.get_case(case_id)
        previous = case.status
        case.status = new_status
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
        return to_case_response(case)

    async def _fanout_emergency_notifications(self, case: EmergencyCase) -> None:
        if case.senior_id is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Emergency case is missing senior_id",
            )
        senior = await self.senior_repo.get_by_id(case.senior_id)
        if not senior:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Senior not found")

        type_label = emergency_type_label(case.type)
        recipients: list[tuple[UUID, str, str]] = []
        if senior.user_id:
            title, message = senior_emergency_copy(type_label)
            recipients.append((senior.user_id, title, message))

        for user_id in await self.access_repo.list_family_user_ids_for_senior(senior.id):
            title, message = family_emergency_copy(senior.first_name, type_label)
            recipients.append((user_id, title, message))

        for user_id in await self.access_repo.list_assigned_care_manager_user_ids_for_senior(senior.id):
            title, message = care_manager_emergency_copy(type_label)
            recipients.append((user_id, title, message))

        seen: set[UUID] = set()
        for user_id, title, message in recipients:
            if user_id in seen:
                continue
            seen.add(user_id)
            await self.notification_repo.create(
                user_id=user_id,
                title=title,
                message=message,
                priority=NotificationPriority.EMERGENCY,
            )
