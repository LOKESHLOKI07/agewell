from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.memberships.models import (
    Membership,
    MembershipBenefit,
    MembershipPlan,
    MembershipUsageLedger,
)


class MembershipRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_memberships_for_senior(self, senior_id: UUID):
        result = await self.session.execute(
            select(Membership, MembershipPlan)
            .join(MembershipPlan, Membership.plan_id == MembershipPlan.id)
            .where(Membership.senior_id == senior_id)
            .order_by(Membership.start_date.desc().nulls_last())
        )
        return result.all()

    async def list_benefits_for_plan(self, plan_id: UUID):
        result = await self.session.execute(
            select(MembershipBenefit).where(MembershipBenefit.plan_id == plan_id)
        )
        return result.scalars().all()

    async def sum_used_amount(self, membership_id: UUID, benefit_id: UUID) -> int:
        result = await self.session.execute(
            select(func.coalesce(func.sum(MembershipUsageLedger.used_amount), 0)).where(
                MembershipUsageLedger.membership_id == membership_id,
                MembershipUsageLedger.benefit_id == benefit_id,
            )
        )
        return int(result.scalar_one())

    async def list_plans(self, *, limit: int = 50, offset: int = 0):
        total = (await self.session.execute(select(func.count()).select_from(MembershipPlan))).scalar_one()
        result = await self.session.execute(
            select(MembershipPlan).order_by(MembershipPlan.name.asc()).offset(offset).limit(limit)
        )
        return list(result.scalars().all()), int(total)

    async def list_benefits(self, *, plan_id: Optional[UUID] = None, limit: int = 50, offset: int = 0):
        stmt = select(MembershipBenefit)
        count_stmt = select(func.count()).select_from(MembershipBenefit)
        if plan_id is not None:
            stmt = stmt.where(MembershipBenefit.plan_id == plan_id)
            count_stmt = count_stmt.where(MembershipBenefit.plan_id == plan_id)
        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(stmt.offset(offset).limit(limit))
        return list(result.scalars().all()), int(total)

    async def list_memberships(self, *, senior_id: Optional[UUID] = None, limit: int = 50, offset: int = 0):
        stmt = select(Membership, MembershipPlan).join(MembershipPlan, Membership.plan_id == MembershipPlan.id)
        count_stmt = select(func.count()).select_from(Membership)
        if senior_id is not None:
            stmt = stmt.where(Membership.senior_id == senior_id)
            count_stmt = count_stmt.where(Membership.senior_id == senior_id)
        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(
            stmt.order_by(Membership.start_date.desc().nulls_last()).offset(offset).limit(limit)
        )
        return result.all(), int(total)
