from datetime import datetime, timezone
from typing import Optional, Sequence
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.emergency.models import (
    ACTIVE_EMERGENCY_STATUSES,
    EmergencyCase,
    EmergencyEvent,
    EmergencyRecipient,
    EmergencyStatus,
    EmergencyType,
    RECIPIENT_PENDING,
    TRIGGER_APP_SOS,
)

CREATED_EVENT_DESCRIPTION = "Emergency case created."


class EmergencyRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    def _case_options(self):
        return (selectinload(EmergencyCase.recipients),)

    async def get_case_by_id(self, case_id: UUID) -> Optional[EmergencyCase]:
        result = await self.session.execute(
            select(EmergencyCase).options(*self._case_options()).where(EmergencyCase.id == case_id)
        )
        return result.scalar_one_or_none()

    async def get_active_case_for_senior(self, senior_id: UUID) -> Optional[EmergencyCase]:
        result = await self.session.execute(
            select(EmergencyCase)
            .options(*self._case_options())
            .where(
                EmergencyCase.senior_id == senior_id,
                EmergencyCase.status.in_(ACTIVE_EMERGENCY_STATUSES),
            )
            .order_by(EmergencyCase.created_at.desc().nulls_last())
            .limit(1)
        )
        return result.scalars().first()

    async def list_due_escalation_ids(self, *, now: datetime, limit: int = 50) -> list[UUID]:
        result = await self.session.execute(
            select(EmergencyCase.id)
            .where(
                EmergencyCase.escalation_due_at.is_not(None),
                EmergencyCase.escalation_due_at <= now,
                EmergencyCase.escalation_dispatched_at.is_(None),
                EmergencyCase.status.notin_((EmergencyStatus.RESOLVED, EmergencyStatus.CANCELLED)),
            )
            .order_by(EmergencyCase.escalation_due_at.asc())
            .limit(limit)
        )
        return [row[0] for row in result.all()]

    async def claim_escalation(self, case_id: UUID, *, now: datetime) -> bool:
        result = await self.session.execute(
            select(EmergencyCase.id)
            .where(
                EmergencyCase.id == case_id,
                EmergencyCase.escalation_dispatched_at.is_(None),
            )
            .with_for_update(skip_locked=True)
        )
        row = result.first()
        if not row:
            return False
        case = await self.get_case_by_id(case_id)
        if not case or case.escalation_dispatched_at is not None:
            return False
        case.escalation_dispatched_at = now
        await self.session.flush()
        return True

    async def release_escalation_claim(self, case_id: UUID) -> None:
        case = await self.get_case_by_id(case_id)
        if not case:
            return
        case.escalation_dispatched_at = None
        await self.session.flush()

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

        stmt = select(EmergencyCase).options(*self._case_options())
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
        return list(result.scalars().unique().all()), int(total)

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

    async def next_case_number(self, when: datetime) -> str:
        year = when.year
        prefix = f"AW-EMG-{year}-"
        result = await self.session.execute(
            select(func.count()).select_from(EmergencyCase).where(EmergencyCase.case_number.like(f"{prefix}%"))
        )
        seq = int(result.scalar_one() or 0) + 1
        return f"{prefix}{seq:06d}"

    async def create_case(
        self,
        *,
        senior_id: UUID,
        emergency_type: EmergencyType,
        trigger_source: str = TRIGGER_APP_SOS,
        location_text: Optional[str] = None,
        case_number: Optional[str] = None,
    ) -> EmergencyCase:
        now = datetime.now(timezone.utc)
        case = EmergencyCase(
            senior_id=senior_id,
            type=emergency_type,
            status=EmergencyStatus.OPEN,
            case_number=case_number or await self.next_case_number(now),
            trigger_source=trigger_source,
            location_text=location_text,
            triggered_at=now,
            created_at=now,
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

    async def add_recipient(
        self,
        *,
        case_id: UUID,
        role: str,
        status: str = RECIPIENT_PENDING,
        notified_at: Optional[datetime] = None,
    ) -> EmergencyRecipient:
        row = EmergencyRecipient(
            case_id=case_id,
            role=role,
            status=status,
            notified_at=notified_at,
        )
        self.session.add(row)
        await self.session.flush()
        return row

    async def add_event(self, *, case_id: UUID, event_description: str) -> EmergencyEvent:
        event = EmergencyEvent(case_id=case_id, event_description=event_description)
        self.session.add(event)
        await self.session.flush()
        return event

    async def save_case(self, case: EmergencyCase) -> EmergencyCase:
        await self.session.commit()
        await self.session.refresh(case, attribute_names=["recipients"])
        return case
