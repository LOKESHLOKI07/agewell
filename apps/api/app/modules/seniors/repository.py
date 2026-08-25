from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.seniors.models import Senior
from app.modules.seniors.schemas import SeniorCreate
from app.modules.users.models import User

class SeniorRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, senior_id):
        stmt = select(Senior).where(Senior.id == senior_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_by_user_id(self, user_id):
        stmt = select(Senior).where(Senior.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def create(self, senior: SeniorCreate) -> Senior:
        db_senior = Senior(**senior.model_dump())
        self.session.add(db_senior)
        await self.session.commit()
        await self.session.refresh(db_senior)
        return db_senior

    async def list_seniors(self, *, limit: int = 50, offset: int = 0):
        count_stmt = select(func.count()).select_from(Senior)
        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(
            select(Senior, User.email)
            .outerjoin(User, Senior.user_id == User.id)
            .order_by(Senior.last_name.asc().nulls_last(), Senior.first_name.asc().nulls_last())
            .offset(offset)
            .limit(limit)
        )
        return result.all(), int(total)
