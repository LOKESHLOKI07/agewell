from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.memberships.models import (
    Membership,
    MembershipBenefit,
    MembershipPlan,
    MembershipRequest,
    MembershipUsageLedger,
)
from app.modules.seniors.models import Senior


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

    async def get_plan_by_name(self, name: str) -> Optional[MembershipPlan]:
        result = await self.session.execute(select(MembershipPlan).where(MembershipPlan.name == name))
        return result.scalar_one_or_none()

    async def get_pending_request_for_senior(self, senior_id: UUID) -> Optional[MembershipRequest]:
        result = await self.session.execute(
            select(MembershipRequest).where(
                MembershipRequest.senior_id == senior_id,
                MembershipRequest.status == "REQUESTED",
            )
        )
        return result.scalars().first()

    async def create_request(self, *, senior_id: UUID, plan_id: UUID, notes: Optional[str]) -> MembershipRequest:
        row = MembershipRequest(senior_id=senior_id, plan_id=plan_id, status="REQUESTED", notes=notes)
        self.session.add(row)
        await self.session.commit()
        await self.session.refresh(row)
        return row

    async def get_request_row(self, request_id: UUID):
        result = await self.session.execute(
            select(MembershipRequest, Senior, MembershipPlan)
            .join(Senior, MembershipRequest.senior_id == Senior.id)
            .join(MembershipPlan, MembershipRequest.plan_id == MembershipPlan.id)
            .where(MembershipRequest.id == request_id)
        )
        return result.first()

    async def list_requests(
        self,
        *,
        senior_id: Optional[UUID] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ):
        stmt = (
            select(MembershipRequest, Senior, MembershipPlan)
            .join(Senior, MembershipRequest.senior_id == Senior.id)
            .join(MembershipPlan, MembershipRequest.plan_id == MembershipPlan.id)
        )
        count_stmt = select(func.count()).select_from(MembershipRequest)
        if senior_id is not None:
            stmt = stmt.where(MembershipRequest.senior_id == senior_id)
            count_stmt = count_stmt.where(MembershipRequest.senior_id == senior_id)
        if status is not None:
            stmt = stmt.where(MembershipRequest.status == status)
            count_stmt = count_stmt.where(MembershipRequest.status == status)
        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(
            stmt.order_by(MembershipRequest.created_at.desc().nulls_last()).offset(offset).limit(limit)
        )
        return result.all(), int(total)

    async def review_request(
        self,
        row: MembershipRequest,
        *,
        status: str,
        membership: Optional[Membership] = None,
    ) -> MembershipRequest:
        row.status = status
        row.reviewed_at = datetime.now(timezone.utc)
        if membership is not None:
            self.session.add(membership)
        await self.session.commit()
        await self.session.refresh(row)
        return row
