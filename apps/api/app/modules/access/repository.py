from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.modules.access.models import FamilySeniorAccess
from app.modules.care.models import CareManager
from app.modules.families.models import FamilyMember
from app.modules.visits.models import Visit


class AccessRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_family_member_by_user_id(self, user_id):
        result = await self.session.execute(
            select(FamilyMember).where(FamilyMember.user_id == user_id)
        )
        return result.scalars().first()

    async def has_family_senior_access(self, family_id, senior_id) -> bool:
        result = await self.session.execute(
            select(FamilySeniorAccess).where(
                FamilySeniorAccess.family_id == family_id,
                FamilySeniorAccess.senior_id == senior_id,
            )
        )
        return result.scalars().first() is not None

    async def get_care_manager_by_user_id(self, user_id) -> CareManager | None:
        result = await self.session.execute(select(CareManager).where(CareManager.user_id == user_id))
        return result.scalars().first()

    async def care_manager_has_assigned_visit_for_senior(self, care_manager_id, senior_id) -> bool:
        result = await self.session.execute(
            select(Visit.id)
            .where(
                Visit.care_manager_id == care_manager_id,
                Visit.senior_id == senior_id,
            )
            .limit(1)
        )
        return result.scalar_one_or_none() is not None

    async def list_assigned_senior_ids(self, care_manager_id) -> list:
        result = await self.session.execute(
            select(Visit.senior_id)
            .where(Visit.care_manager_id == care_manager_id, Visit.senior_id.is_not(None))
            .distinct()
        )
        return [senior_id for senior_id in result.scalars().all()]

    async def list_family_user_ids_for_senior(self, senior_id) -> list:
        result = await self.session.execute(
            select(FamilyMember.user_id)
            .join(FamilySeniorAccess, FamilySeniorAccess.family_id == FamilyMember.id)
            .where(
                FamilySeniorAccess.senior_id == senior_id,
                FamilyMember.user_id.is_not(None),
            )
            .distinct()
        )
        return [user_id for user_id in result.scalars().all() if user_id is not None]

    async def list_assigned_care_manager_user_ids_for_senior(self, senior_id) -> list:
        result = await self.session.execute(
            select(CareManager.user_id)
            .join(Visit, Visit.care_manager_id == CareManager.id)
            .where(
                Visit.senior_id == senior_id,
                CareManager.user_id.is_not(None),
            )
            .distinct()
        )
        return [user_id for user_id in result.scalars().all() if user_id is not None]

    async def get_access_by_id(self, access_id) -> FamilySeniorAccess | None:
        result = await self.session.execute(select(FamilySeniorAccess).where(FamilySeniorAccess.id == access_id))
        return result.scalars().first()

    async def list_access(self, *, family_id=None, senior_id=None, limit: int = 50, offset: int = 0):
        from sqlalchemy.orm import aliased

        from app.modules.seniors.models import Senior
        from app.modules.users.models import User

        family_user = aliased(User)
        senior_user = aliased(User)

        stmt = (
            select(
                FamilySeniorAccess,
                FamilyMember.first_name.label("family_first_name"),
                FamilyMember.last_name.label("family_last_name"),
                family_user.email.label("family_email"),
                Senior.first_name.label("senior_first_name"),
                Senior.last_name.label("senior_last_name"),
                senior_user.email.label("senior_email"),
            )
            .outerjoin(FamilyMember, FamilyMember.id == FamilySeniorAccess.family_id)
            .outerjoin(family_user, family_user.id == FamilyMember.user_id)
            .outerjoin(Senior, Senior.id == FamilySeniorAccess.senior_id)
            .outerjoin(senior_user, senior_user.id == Senior.user_id)
        )
        count_stmt = select(func.count()).select_from(FamilySeniorAccess)
        if family_id is not None:
            stmt = stmt.where(FamilySeniorAccess.family_id == family_id)
            count_stmt = count_stmt.where(FamilySeniorAccess.family_id == family_id)
        if senior_id is not None:
            stmt = stmt.where(FamilySeniorAccess.senior_id == senior_id)
            count_stmt = count_stmt.where(FamilySeniorAccess.senior_id == senior_id)
        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(
            stmt.order_by(FamilySeniorAccess.created_at.desc().nulls_last()).offset(offset).limit(limit)
        )
        return list(result.all()), int(total)

    async def create_access(self, *, family_id, senior_id) -> FamilySeniorAccess:
        row = FamilySeniorAccess(family_id=family_id, senior_id=senior_id)
        self.session.add(row)
        await self.session.commit()
        await self.session.refresh(row)
        return row

    async def delete_access(self, row: FamilySeniorAccess) -> None:
        await self.session.delete(row)
        await self.session.commit()
