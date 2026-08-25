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

    async def get_with_user(self, senior_id):
        result = await self.session.execute(
            select(Senior, User).outerjoin(User, Senior.user_id == User.id).where(Senior.id == senior_id)
        )
        return result.first()

    async def create(self, senior: SeniorCreate) -> Senior:
        db_senior = Senior(**senior.model_dump())
        self.session.add(db_senior)
        await self.session.commit()
        await self.session.refresh(db_senior)
        return db_senior

    async def update(self, senior: Senior, data: dict) -> Senior:
        for field, value in data.items():
            setattr(senior, field, value)
        await self.session.commit()
        await self.session.refresh(senior)
        return senior

    async def list_seniors(self, *, limit: int = 50, offset: int = 0):
        count_stmt = select(func.count()).select_from(Senior)
        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(
            select(Senior, User.email, User.phone, User.account_status)
            .outerjoin(User, Senior.user_id == User.id)
            .order_by(Senior.last_name.asc().nulls_last(), Senior.first_name.asc().nulls_last())
            .offset(offset)
            .limit(limit)
        )
        return result.all(), int(total)
