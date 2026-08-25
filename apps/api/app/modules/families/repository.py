from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.access.models import FamilySeniorAccess
from app.modules.families.models import FamilyMember
from app.modules.seniors.models import Senior


class FamilyRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_user_id(self, user_id: UUID) -> Optional[FamilyMember]:
        result = await self.session.execute(select(FamilyMember).where(FamilyMember.user_id == user_id))
        return result.scalars().first()

    async def get_by_id(self, family_id: UUID) -> Optional[FamilyMember]:
        result = await self.session.execute(select(FamilyMember).where(FamilyMember.id == family_id))
        return result.scalars().first()

    async def list_authorized_seniors(self, family_id: UUID) -> list[Senior]:
        result = await self.session.execute(
            select(Senior)
            .join(FamilySeniorAccess, FamilySeniorAccess.senior_id == Senior.id)
            .where(FamilySeniorAccess.family_id == family_id)
            .order_by(Senior.first_name.asc().nulls_last(), Senior.last_name.asc().nulls_last())
        )
        return list(result.scalars().all())

    async def list_families(self, *, limit: int = 50, offset: int = 0):
        from sqlalchemy import func

        count_stmt = select(func.count()).select_from(FamilyMember)
        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(
            select(FamilyMember)
            .order_by(FamilyMember.last_name.asc().nulls_last(), FamilyMember.first_name.asc().nulls_last())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all()), int(total)
