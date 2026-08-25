from typing import Optional, Sequence
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.emergency.models import EmergencyCase, EmergencyEvent, EmergencyStatus, EmergencyType

CREATED_EVENT_DESCRIPTION = "Emergency case created."


class EmergencyRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_case_by_id(self, case_id: UUID) -> Optional[EmergencyCase]:
        result = await self.session.execute(select(EmergencyCase).where(EmergencyCase.id == case_id))
        return result.scalar_one_or_none()

    async def list_cases(
        self,
        *,
        senior_id: Optional[UUID] = None,
        assigned_senior_ids: Optional[Sequence[UUID]] = None,
        status: Optional[EmergencyStatus] = None,
        emergency_type: Optional[EmergencyType] = None,
        limit: int = 50,
        offset: int = 0,
    ):
        if assigned_senior_ids is not None and len(assigned_senior_ids) == 0:
            return [], 0

        stmt = select(EmergencyCase)
        count_stmt = select(func.count()).select_from(EmergencyCase)

        if senior_id is not None:
            stmt = stmt.where(EmergencyCase.senior_id == senior_id)
            count_stmt = count_stmt.where(EmergencyCase.senior_id == senior_id)
        elif assigned_senior_ids is not None:
            stmt = stmt.where(EmergencyCase.senior_id.in_(assigned_senior_ids))
            count_stmt = count_stmt.where(EmergencyCase.senior_id.in_(assigned_senior_ids))

        if status is not None:
            stmt = stmt.where(EmergencyCase.status == status)
            count_stmt = count_stmt.where(EmergencyCase.status == status)
        if emergency_type is not None:
            stmt = stmt.where(EmergencyCase.type == emergency_type)
            count_stmt = count_stmt.where(EmergencyCase.type == emergency_type)

        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(
            stmt.order_by(EmergencyCase.created_at.desc().nulls_last()).offset(offset).limit(limit)
        )
        return list(result.scalars().all()), int(total)

    async def list_events(self, case_id: UUID, *, limit: int = 50, offset: int = 0):
        filters = EmergencyEvent.case_id == case_id
        count_stmt = select(func.count()).select_from(EmergencyEvent).where(filters)
        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(
            select(EmergencyEvent)
            .where(filters)
            .order_by(EmergencyEvent.created_at.asc().nulls_last())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all()), int(total)

    async def create_case(self, *, senior_id: UUID, emergency_type: EmergencyType) -> EmergencyCase:
        case = EmergencyCase(
            senior_id=senior_id,
            type=emergency_type,
            status=EmergencyStatus.OPEN,
        )
        self.session.add(case)
        await self.session.flush()
        self.session.add(
            EmergencyEvent(
                case_id=case.id,
                event_description=CREATED_EVENT_DESCRIPTION,
            )
        )
        await self.session.flush()
        return case

    async def add_event(self, *, case_id: UUID, event_description: str) -> EmergencyEvent:
        event = EmergencyEvent(case_id=case_id, event_description=event_description)
        self.session.add(event)
        await self.session.flush()
        return event

    async def save_case(self, case: EmergencyCase) -> EmergencyCase:
        await self.session.commit()
        await self.session.refresh(case)
        return case
