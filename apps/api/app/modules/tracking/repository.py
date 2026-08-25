from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.tracking.models import LocationPoint, LocationSession


class TrackingRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_session(self, *, user_id: UUID) -> LocationSession:
        row = LocationSession(user_id=user_id)
        self.session.add(row)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def get_session(self, session_id: UUID) -> Optional[LocationSession]:
        result = await self.session.execute(
            select(LocationSession).where(LocationSession.id == session_id)
        )
        return result.scalars().first()

    async def get_newest_session_for_user(self, user_id: UUID) -> Optional[LocationSession]:
        result = await self.session.execute(
            select(LocationSession)
            .where(LocationSession.user_id == user_id)
            .order_by(LocationSession.id.desc())
            .limit(1)
        )
        return result.scalars().first()

    async def list_sessions(
        self,
        *,
        user_ids: Optional[list[UUID]] = None,
        limit: int = 50,
        offset: int = 0,
    ):
        stmt = select(LocationSession)
        count_stmt = select(func.count()).select_from(LocationSession)
        if user_ids is not None:
            stmt = stmt.where(LocationSession.user_id.in_(user_ids))
            count_stmt = count_stmt.where(LocationSession.user_id.in_(user_ids))
        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(
            stmt.order_by(LocationSession.id.desc()).offset(offset).limit(limit)
        )
        return list(result.scalars().all()), int(total)

    async def create_point(self, **kwargs) -> LocationPoint:
        row = LocationPoint(**kwargs)
        self.session.add(row)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def get_latest_point(self, session_id: UUID) -> Optional[LocationPoint]:
        result = await self.session.execute(
            select(LocationPoint)
            .where(LocationPoint.session_id == session_id)
            .order_by(LocationPoint.timestamp.desc().nulls_last(), LocationPoint.id.desc())
            .limit(1)
        )
        return result.scalars().first()

    async def list_points(
        self,
        session_id: UUID,
        *,
        limit: int = 50,
        offset: int = 0,
    ):
        count_stmt = (
            select(func.count())
            .select_from(LocationPoint)
            .where(LocationPoint.session_id == session_id)
        )
        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(
            select(LocationPoint)
            .where(LocationPoint.session_id == session_id)
            .order_by(LocationPoint.timestamp.desc().nulls_last(), LocationPoint.id.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all()), int(total)
