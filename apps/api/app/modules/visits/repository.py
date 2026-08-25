from datetime import date
from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.timezone import scheduled_on_app_date
from app.modules.care.models import CareManager
from app.modules.visits.models import Visit, VisitReport, VisitStatus, VisitTask


class VisitRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, visit_id: UUID) -> Optional[tuple[Visit, Optional[CareManager]]]:
        stmt = (
            select(Visit, CareManager)
            .outerjoin(CareManager, Visit.care_manager_id == CareManager.id)
            .where(Visit.id == visit_id)
        )
        result = await self.session.execute(stmt)
        row = result.first()
        return (row[0], row[1]) if row else None

    async def list_visits(
        self,
        *,
        senior_id: Optional[UUID] = None,
        care_manager_id: Optional[UUID] = None,
        status: Optional[VisitStatus] = None,
        on_date: Optional[date] = None,
        upcoming: bool = False,
        limit: int = 50,
        offset: int = 0,
    ):
        stmt = select(Visit, CareManager).outerjoin(CareManager, Visit.care_manager_id == CareManager.id)
        count_stmt = select(func.count()).select_from(Visit)

        if senior_id is not None:
            stmt = stmt.where(Visit.senior_id == senior_id)
            count_stmt = count_stmt.where(Visit.senior_id == senior_id)
        if care_manager_id is not None:
            stmt = stmt.where(Visit.care_manager_id == care_manager_id)
            count_stmt = count_stmt.where(Visit.care_manager_id == care_manager_id)
        if status is not None:
            stmt = stmt.where(Visit.status == status)
            count_stmt = count_stmt.where(Visit.status == status)
        if on_date is not None:
            day_filter = scheduled_on_app_date(Visit.scheduled_at, on_date)
            stmt = stmt.where(day_filter)
            count_stmt = count_stmt.where(day_filter)
        if upcoming:
            upcoming_filter = Visit.scheduled_at >= func.now()
            stmt = stmt.where(upcoming_filter)
            count_stmt = count_stmt.where(upcoming_filter)

        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(
            stmt.order_by(Visit.scheduled_at.asc().nulls_last()).offset(offset).limit(limit)
        )
        return result.all(), int(total)

    async def list_tasks(self, visit_id: UUID) -> list[VisitTask]:
        result = await self.session.execute(
            select(VisitTask).where(VisitTask.visit_id == visit_id).order_by(VisitTask.task_name.asc())
        )
        return list(result.scalars().all())

    async def list_reports(self, visit_id: UUID) -> list[VisitReport]:
        result = await self.session.execute(select(VisitReport).where(VisitReport.visit_id == visit_id))
        return list(result.scalars().all())

    async def create(self, **kwargs) -> Visit:
        visit = Visit(**kwargs)
        self.session.add(visit)
        await self.session.commit()
        await self.session.refresh(visit)
        return visit

    async def update(self, visit: Visit, data: dict) -> Visit:
        for field, value in data.items():
            setattr(visit, field, value)
        await self.session.commit()
        await self.session.refresh(visit)
        return visit
