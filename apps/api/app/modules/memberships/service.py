from datetime import date, datetime, timedelta, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status

from app.api.schemas import ListPage
from app.modules.memberships.models import Membership
from app.modules.memberships.repository import MembershipRepository
from app.modules.memberships.schemas import (
    CurrentMembershipResponse,
    MembershipBenefitItem,
    MembershipBenefitResponse,
    MembershipPlanResponse,
    MembershipRecordResponse,
    MembershipRequestCreate,
    MembershipRequestResponse,
    MembershipUsageItem,
)
from app.modules.seniors.models import Senior


PLAN_KEY_TO_NAME = {
    "basic": "Basic Membership",
    "couple": "Couple Membership",
}
MEMBERSHIP_DURATION_DAYS = 30


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

    async def create_request(self, senior_id: UUID, payload: MembershipRequestCreate) -> MembershipRequestResponse:
        if await self._active_membership(senior_id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You already have an active membership.",
            )
        pending = await self.repo.get_pending_request_for_senior(senior_id)
        if pending:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A membership request is already pending.",
            )
        plan_name = PLAN_KEY_TO_NAME[payload.plan_key]
        plan = await self.repo.get_plan_by_name(plan_name)
        if not plan:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membership plan is not available.")
        notes = payload.notes.strip() if payload.notes and payload.notes.strip() else None
        created = await self.repo.create_request(senior_id=senior_id, plan_id=plan.id, notes=notes)
        row = await self.repo.get_request_row(created.id)
        if not row:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Membership request could not be loaded.")
        return _to_request_response(*row)

    async def list_requests(
        self,
        *,
        senior_id: Optional[UUID] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> ListPage[MembershipRequestResponse]:
        rows, total = await self.repo.list_requests(
            senior_id=senior_id,
            status=status,
            limit=limit,
            offset=offset,
        )
        return ListPage(
            items=[_to_request_response(request, senior, plan) for request, senior, plan in rows],
            total=total,
            limit=limit,
            offset=offset,
        )

    async def review_request(self, request_id: UUID, new_status: str) -> MembershipRequestResponse:
        row = await self.repo.get_request_row(request_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membership request not found")
        request, senior, plan = row
        if request.status != "REQUESTED":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This request has already been reviewed.",
            )
        membership = None
        if new_status == "APPROVED":
            if await self._active_membership(request.senior_id):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This senior already has an active membership.",
                )
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            membership = Membership(
                senior_id=request.senior_id,
                plan_id=request.plan_id,
                start_date=now,
                end_date=now + timedelta(days=MEMBERSHIP_DURATION_DAYS),
            )
        await self.repo.review_request(request, status=new_status, membership=membership)
        refreshed = await self.repo.get_request_row(request.id)
        if not refreshed:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Membership request could not be loaded.",
            )
        request, senior, plan = refreshed
        return _to_request_response(request, senior, plan)

    async def _active_membership(self, senior_id: UUID):
        row = await self._current_membership_row(senior_id)
        if not row:
            return None
        membership, _plan = row
        if compute_membership_status(membership.start_date, membership.end_date) == "ACTIVE":
            return membership
        return None


def _senior_name(senior: Senior) -> Optional[str]:
    parts = [part for part in (senior.first_name, senior.last_name) if part]
    name = " ".join(parts).strip()
    return name or None


def _plan_price(plan) -> Optional[float]:
    if plan.price is None:
        return None
    return float(plan.price)


def _to_request_response(request, senior: Senior, plan) -> MembershipRequestResponse:
    return MembershipRequestResponse(
        id=request.id,
        senior_id=request.senior_id,
        senior_name=_senior_name(senior),
        plan_id=plan.id,
        plan_name=plan.name or "",
        plan_price=_plan_price(plan),
        status=request.status,
        notes=request.notes,
        created_at=request.created_at,
        reviewed_at=request.reviewed_at,
    )
