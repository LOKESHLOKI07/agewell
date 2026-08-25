from datetime import date, datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status

from app.api.schemas import ListPage
from app.modules.memberships.repository import MembershipRepository
from app.modules.memberships.schemas import (
    CurrentMembershipResponse,
    MembershipBenefitItem,
    MembershipBenefitResponse,
    MembershipPlanResponse,
    MembershipRecordResponse,
    MembershipUsageItem,
)


def _as_date(value: Optional[datetime]) -> Optional[date]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    return value


def compute_membership_status(start_date, end_date, today: Optional[date] = None) -> str:
    today = today or datetime.now(timezone.utc).date()
    start = _as_date(start_date)
    end = _as_date(end_date)
    if start and start > today:
        return "UPCOMING"
    if end and end < today:
        return "EXPIRED"
    return "ACTIVE"


class MembershipService:
    def __init__(self, repo: MembershipRepository):
        self.repo = repo

    async def _current_membership_row(self, senior_id: UUID):
        rows = await self.repo.list_memberships_for_senior(senior_id)
        if not rows:
            return None
        today = datetime.now(timezone.utc).date()
        for membership, plan in rows:
            if compute_membership_status(membership.start_date, membership.end_date, today) == "ACTIVE":
                return membership, plan
        return rows[0]

    async def get_current_membership(self, senior_id: UUID) -> CurrentMembershipResponse:
        row = await self._current_membership_row(senior_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membership not found")
        membership, plan = row
        benefits = await self.repo.list_benefits_for_plan(plan.id)
        return CurrentMembershipResponse(
            membership_id=membership.id,
            plan_id=plan.id,
            plan_name=plan.name,
            status=compute_membership_status(membership.start_date, membership.end_date),
            start_date=membership.start_date,
            end_date=membership.end_date,
            benefits=[
                MembershipBenefitItem(
                    benefit_id=benefit.id,
                    benefit_name=benefit.benefit_name,
                    quota=benefit.quota,
                )
                for benefit in benefits
            ],
        )

    async def get_current_usage(self, senior_id: UUID) -> List[MembershipUsageItem]:
        membership = await self.get_current_membership(senior_id)
        items: List[MembershipUsageItem] = []
        for benefit in membership.benefits:
            used = await self.repo.sum_used_amount(membership.membership_id, benefit.benefit_id)
            remaining = None if benefit.quota is None else max(benefit.quota - used, 0)
            items.append(
                MembershipUsageItem(
                    benefit_id=benefit.benefit_id,
                    benefit_name=benefit.benefit_name,
                    quota=benefit.quota,
                    used=used,
                    remaining=remaining,
                )
            )
        return items

    async def list_plans(self, *, limit: int = 50, offset: int = 0) -> ListPage[MembershipPlanResponse]:
        rows, total = await self.repo.list_plans(limit=limit, offset=offset)
        return ListPage(
            items=[MembershipPlanResponse.model_validate(row) for row in rows],
            total=total,
            limit=limit,
            offset=offset,
        )

    async def list_benefits(self, *, plan_id=None, limit: int = 50, offset: int = 0) -> ListPage[MembershipBenefitResponse]:
        rows, total = await self.repo.list_benefits(plan_id=plan_id, limit=limit, offset=offset)
        return ListPage(
            items=[MembershipBenefitResponse.model_validate(row) for row in rows],
            total=total,
            limit=limit,
            offset=offset,
        )

    async def list_memberships(self, *, senior_id=None, limit: int = 50, offset: int = 0) -> ListPage[MembershipRecordResponse]:
        rows, total = await self.repo.list_memberships(senior_id=senior_id, limit=limit, offset=offset)
        items = [
            MembershipRecordResponse(
                id=membership.id,
                senior_id=membership.senior_id,
                plan_id=membership.plan_id,
                plan_name=plan.name,
                status=compute_membership_status(membership.start_date, membership.end_date),
                start_date=membership.start_date,
                end_date=membership.end_date,
            )
            for membership, plan in rows
        ]
        return ListPage(items=items, total=total, limit=limit, offset=offset)
