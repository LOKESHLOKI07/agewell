from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.care.models import CareManager
from app.modules.deliveries.models import DeliveryStatus, StaffDelivery


class DeliveryRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, delivery_id: UUID) -> Optional[StaffDelivery]:
        result = await self.session.execute(select(StaffDelivery).where(StaffDelivery.id == delivery_id))
        return result.scalars().first()

    async def list_for_senior(
        self,
        senior_id: UUID,
        *,
        status: Optional[DeliveryStatus] = None,
        limit: int = 50,
        offset: int = 0,
    ):
        stmt = select(StaffDelivery).where(StaffDelivery.senior_id == senior_id)
        count_stmt = select(func.count()).select_from(StaffDelivery).where(StaffDelivery.senior_id == senior_id)
        if status is not None:
            stmt = stmt.where(StaffDelivery.status == status)
            count_stmt = count_stmt.where(StaffDelivery.status == status)
        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(
            stmt.order_by(StaffDelivery.scheduled_at.asc().nulls_last()).offset(offset).limit(limit)
        )
        return list(result.scalars().all()), int(total)

    async def get_care_manager(self, care_manager_id: UUID) -> Optional[CareManager]:
        result = await self.session.execute(select(CareManager).where(CareManager.id == care_manager_id))
        return result.scalars().first()
