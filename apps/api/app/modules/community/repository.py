from typing import Optional
from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.community.models import CommunityEvent, EventRegistration
from app.modules.community.schemas import RegistrationStatus


class CommunityRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_events(self, *, limit: int = 50, offset: int = 0):
        count_stmt = select(func.count()).select_from(CommunityEvent)
        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(
            select(CommunityEvent)
            .order_by(CommunityEvent.event_date.asc().nulls_last(), CommunityEvent.title.asc().nulls_last())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all()), int(total)

    async def get_event_by_id(self, event_id: UUID) -> Optional[CommunityEvent]:
        result = await self.session.execute(select(CommunityEvent).where(CommunityEvent.id == event_id))
        return result.scalars().first()

    async def lock_event_by_id(self, event_id: UUID) -> Optional[CommunityEvent]:
        result = await self.session.execute(
            select(CommunityEvent).where(CommunityEvent.id == event_id).with_for_update()
        )
        return result.scalars().first()

    async def create_event(self, **kwargs) -> CommunityEvent:
        event = CommunityEvent(**kwargs)
        self.session.add(event)
        await self.session.flush()
        await self.session.refresh(event)
        return event

    async def update_event(self, event: CommunityEvent, data: dict) -> CommunityEvent:
        for field, value in data.items():
            setattr(event, field, value)
        await self.session.flush()
        await self.session.refresh(event)
        return event

    async def delete_event(self, event: CommunityEvent) -> None:
        await self.session.execute(delete(EventRegistration).where(EventRegistration.event_id == event.id))
        await self.session.delete(event)
        await self.session.flush()

    async def get_registration(self, registration_id: UUID) -> Optional[tuple[EventRegistration, Optional[str]]]:
        result = await self.session.execute(
            select(EventRegistration, CommunityEvent.title)
            .outerjoin(CommunityEvent, EventRegistration.event_id == CommunityEvent.id)
            .where(EventRegistration.id == registration_id)
        )
        row = result.first()
        return (row[0], row[1]) if row else None

    async def get_registration_for_event_user(
        self, event_id: UUID, user_id: UUID
    ) -> Optional[EventRegistration]:
        result = await self.session.execute(
            select(EventRegistration).where(
                EventRegistration.event_id == event_id,
                EventRegistration.user_id == user_id,
            )
        )
        return result.scalars().first()

    async def list_registrations(
        self,
        *,
        user_ids: Optional[list[UUID]] = None,
        limit: int = 50,
        offset: int = 0,
    ):
        stmt = select(EventRegistration, CommunityEvent.title).outerjoin(
            CommunityEvent, EventRegistration.event_id == CommunityEvent.id
        )
        count_stmt = select(func.count()).select_from(EventRegistration)
        if user_ids is not None:
            stmt = stmt.where(EventRegistration.user_id.in_(user_ids))
            count_stmt = count_stmt.where(EventRegistration.user_id.in_(user_ids))
        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(
            stmt.order_by(EventRegistration.id.desc()).offset(offset).limit(limit)
        )
        return result.all(), int(total)

    async def create_registration(self, **kwargs) -> EventRegistration:
        row = EventRegistration(**kwargs)
        self.session.add(row)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def update_registration(self, row: EventRegistration, data: dict) -> EventRegistration:
        for field, value in data.items():
            setattr(row, field, value)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def count_active_registrations(self, event_id: UUID) -> int:
        result = await self.session.execute(
            select(func.count())
            .select_from(EventRegistration)
            .where(
                EventRegistration.event_id == event_id,
                EventRegistration.status == RegistrationStatus.REGISTERED.value,
            )
        )
        return int(result.scalar_one())
