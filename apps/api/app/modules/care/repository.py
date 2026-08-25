from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.care.models import CareManager
from app.modules.visits.models import Visit


class CareManagerRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_user_id(self, user_id: UUID) -> Optional[CareManager]:
        result = await self.session.execute(select(CareManager).where(CareManager.user_id == user_id))
        return result.scalars().first()

    async def list_all(self) -> list[CareManager]:
        result = await self.session.execute(select(CareManager).order_by(CareManager.employee_id.asc().nulls_last()))
        return list(result.scalars().all())

    async def list_associated_with_senior(self, senior_id: UUID) -> list[CareManager]:
        stmt = (
            select(CareManager)
            .join(Visit, Visit.care_manager_id == CareManager.id)
            .where(Visit.senior_id == senior_id)
            .distinct()
            .order_by(CareManager.employee_id.asc().nulls_last())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, care_manager_id: UUID) -> Optional[CareManager]:
        result = await self.session.execute(select(CareManager).where(CareManager.id == care_manager_id))
        return result.scalars().first()

    async def get_by_employee_id(self, employee_id: str) -> Optional[CareManager]:
        result = await self.session.execute(select(CareManager).where(CareManager.employee_id == employee_id))
        return result.scalars().first()

    async def create(self, payload) -> CareManager:
        row = CareManager(
            user_id=payload.user_id,
            employee_id=payload.employee_id,
            first_name=payload.first_name,
            last_name=payload.last_name,
            skills=payload.skills,
            status=payload.status,
        )
        self.session.add(row)
        await self.session.commit()
        await self.session.refresh(row)
        return row

    async def update(self, row: CareManager, data: dict) -> CareManager:
        for field, value in data.items():
            setattr(row, field, value)
        await self.session.commit()
        await self.session.refresh(row)
        return row
