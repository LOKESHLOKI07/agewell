from datetime import date, datetime, timedelta, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status

from app.api.schemas import ListPage
from app.modules.care.models import (
    CARE_STAFF_KIND_CARE_MANAGER,
    CARE_STAFF_KIND_COMPANION,
    CARE_STATUS_ACTIVE,
)
from app.modules.memberships.models import (
    STAGE_ACCEPTED,
    STAGE_APPROVED,
    STAGE_IN_REVIEW,
    STAGE_ORDER,
    STAGE_REJECTED,
    STAGE_SUBMITTED,
    STAGE_VISIT_COMPLETED,
    STAGE_VISIT_PLANNED,
    STAGE_VISIT_SCHEDULED,
    Membership,
)
from app.modules.memberships.repository import MembershipRepository
from app.modules.memberships.schemas import (
    CurrentMembershipResponse,
    MembershipBenefitItem,
    MembershipBenefitResponse,
    MembershipPlanResponse,
    MembershipRecordResponse,
    MembershipRequestCreate,
    MembershipRequestResponse,
    MembershipRequestStageUpdate,
    MembershipUsageItem,
)
from app.modules.seniors.models import Senior


PLAN_KEY_TO_NAME = {
    "single": "Single Membership",
    "basic": "Single Membership",  # legacy plan key
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


def _stage_index(stage: str) -> int:
    try:
        return STAGE_ORDER.index(stage)
    except ValueError:
        return -1


def _care_display_name(row) -> Optional[str]:
    if row is None:
        return None
    parts = [part for part in (getattr(row, "first_name", None), getattr(row, "last_name", None)) if part]
    name = " ".join(parts).strip()
    return name or getattr(row, "employee_id", None)


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
        created = await self.repo.create_request(
            senior_id=senior_id,
            plan_id=plan.id,
            notes=payload.notes,
            family_contact_1_name=payload.family_contact_1_name,
            family_contact_1_phone=payload.family_contact_1_phone,
            family_contact_2_name=payload.family_contact_2_name,
            family_contact_2_phone=payload.family_contact_2_phone,
            emergency_contact_name=payload.emergency_contact_name,
            emergency_contact_phone=payload.emergency_contact_phone,
            preferred_hospital=payload.preferred_hospital,
        )
        return await self._request_response(created.id)

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
        items = []
        for request, senior, plan in rows:
            items.append(await self._to_request_response(request, senior, plan))
        return ListPage(items=items, total=total, limit=limit, offset=offset)

    async def review_request(self, request_id: UUID, new_status: str) -> MembershipRequestResponse:
        """Legacy approve/reject. Approve now means accept (show Pay Now), not activate."""
        row = await self.repo.get_request_row(request_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membership request not found")
        request, _senior, _plan = row
        current_status = request.status
        current_stage = getattr(request, "stage", None) or STAGE_SUBMITTED

        if new_status == "APPROVED":
            if current_status != "REQUESTED":
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Only pending membership requests can be accepted.",
                )
            # Jump to ACCEPTED so member can pay; do not create membership yet.
            now = datetime.now(timezone.utc)
            if current_stage in (STAGE_SUBMITTED, STAGE_VISIT_PLANNED, STAGE_VISIT_SCHEDULED):
                if not request.visit_planned_at:
                    request.visit_planned_at = now
                if not request.visit_scheduled_start:
                    request.visit_scheduled_start = now
                if not request.visit_completed_at:
                    request.visit_completed_at = now
            if not request.review_completed_at:
                request.review_completed_at = now
            request.accepted_at = now
            request.stage = STAGE_ACCEPTED
            request.reviewed_at = now
            await self.repo.save_request(request)
        elif new_status == "REJECTED":
            if current_status == "REJECTED":
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This request is already rejected.",
                )
            if current_status not in ("REQUESTED", "APPROVED"):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This request cannot be rejected.",
                )
            expire_membership = None
            if current_status == "APPROVED":
                expire_membership = await self._active_membership(request.senior_id)
            await self.repo.review_request(
                request,
                status="REJECTED",
                stage=STAGE_REJECTED,
                expire_membership=expire_membership,
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Unsupported membership review status.",
            )

        return await self._request_response(request.id)

    async def update_request_stage(
        self,
        request_id: UUID,
        payload: MembershipRequestStageUpdate,
    ) -> MembershipRequestResponse:
        row = await self.repo.get_request_row(request_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membership request not found")
        request, senior, _plan = row
        if request.status == "REJECTED" or (getattr(request, "stage", None) == STAGE_REJECTED):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Rejected applications cannot be updated.")

        now = datetime.now(timezone.utc)

        if payload.clear_care_manager:
            request.care_manager_id = None
            senior.care_manager_id = None
        elif payload.care_manager_id is not None:
            care = await self._require_staff(payload.care_manager_id, CARE_STAFF_KIND_CARE_MANAGER)
            request.care_manager_id = care.id
            senior.care_manager_id = care.id

        if payload.clear_companion:
            request.companion_id = None
            senior.companion_id = None
        elif payload.companion_id is not None:
            companion = await self._require_staff(payload.companion_id, CARE_STAFF_KIND_COMPANION)
            request.companion_id = companion.id
            senior.companion_id = companion.id

        if payload.visit_scheduled_start is not None:
            request.visit_scheduled_start = payload.visit_scheduled_start
        if payload.visit_scheduled_end is not None:
            request.visit_scheduled_end = payload.visit_scheduled_end

        if payload.stage is not None:
            target = payload.stage.value if hasattr(payload.stage, "value") else str(payload.stage)
            await self._apply_stage(request, senior, target, now)

        await self.repo.save_request(request)
        return await self._request_response(request.id)

    async def confirm_payment(self, request_id: UUID, *, senior_id: UUID) -> MembershipRequestResponse:
        """Member Pay Now — activates membership after application is accepted."""
        row = await self.repo.get_request_row(request_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membership request not found")
        request, _senior, _plan = row
        if request.senior_id != senior_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your membership application.")
        stage = getattr(request, "stage", None) or STAGE_SUBMITTED
        if stage != STAGE_ACCEPTED or request.status != "REQUESTED":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Payment is only available after the application is accepted.",
            )
        await self._activate_membership(request)
        return await self._request_response(request.id)

    async def _apply_stage(self, request, senior: Senior, target: str, now: datetime) -> None:
        current = getattr(request, "stage", None) or STAGE_SUBMITTED
        if target == STAGE_REJECTED:
            if request.status == "APPROVED":
                active = await self._active_membership(request.senior_id)
                if active is not None:
                    await self.repo.session.delete(active)
            request.stage = STAGE_REJECTED
            request.status = "REJECTED"
            request.reviewed_at = now
            return

        if current in (STAGE_APPROVED, STAGE_REJECTED):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This application is already closed.",
            )

        if target == STAGE_APPROVED:
            if current != STAGE_ACCEPTED:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Mark the application accepted before confirming payment.",
                )
            await self._activate_membership(request)
            return

        target_idx = _stage_index(target)
        current_idx = _stage_index(current)
        if target_idx < 0:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Unknown stage.")
        if target_idx <= current_idx:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Application is already at {current}.",
            )

        if target == STAGE_VISIT_SCHEDULED and not request.visit_scheduled_start:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Provide visit_scheduled_start when scheduling the visit.",
            )

        # Allow advancing one or more steps; fill missing timestamps.
        for stage in STAGE_ORDER[current_idx + 1 : target_idx + 1]:
            self._stamp_stage(request, stage, now)

    def _stamp_stage(self, request, stage: str, now: datetime) -> None:
        request.stage = stage
        if stage == STAGE_VISIT_PLANNED and not request.visit_planned_at:
            request.visit_planned_at = now
        elif stage == STAGE_VISIT_SCHEDULED:
            if not request.visit_planned_at:
                request.visit_planned_at = now
            if not request.visit_scheduled_start:
                request.visit_scheduled_start = now
        elif stage == STAGE_VISIT_COMPLETED:
            if not request.visit_completed_at:
                request.visit_completed_at = now
        elif stage == STAGE_IN_REVIEW:
            if not request.review_completed_at:
                request.review_completed_at = now
        elif stage == STAGE_ACCEPTED:
            if not request.review_completed_at:
                request.review_completed_at = now
            request.accepted_at = now
            request.reviewed_at = now

    async def _activate_membership(self, request) -> None:
        if await self._active_membership(request.senior_id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This senior already has an active membership.",
            )
        now = datetime.now(timezone.utc)
        naive = now.replace(tzinfo=None)
        membership = Membership(
            senior_id=request.senior_id,
            plan_id=request.plan_id,
            start_date=naive,
            end_date=naive + timedelta(days=MEMBERSHIP_DURATION_DAYS),
        )
        request.stage = STAGE_APPROVED
        request.status = "APPROVED"
        request.paid_at = now
        request.reviewed_at = now
        self.repo.session.add(membership)
        await self.repo.save_request(request)

    async def _require_staff(self, staff_id: UUID, expected_kind: str):
        row = await self.repo.get_care_manager(staff_id)
        if row is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff member not found.")
        kind = getattr(row, "staff_kind", None) or CARE_STAFF_KIND_CARE_MANAGER
        if kind != expected_kind:
            label = "care manager" if expected_kind == CARE_STAFF_KIND_CARE_MANAGER else "companion"
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Selected staff is not a {label}.",
            )
        if getattr(row, "status", None) != CARE_STATUS_ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Only active staff can be assigned.",
            )
        return row

    async def _active_membership(self, senior_id: UUID):
        row = await self._current_membership_row(senior_id)
        if not row:
            return None
        membership, _plan = row
        if compute_membership_status(membership.start_date, membership.end_date) == "ACTIVE":
            return membership
        return None

    async def cancel_membership(self, membership_id: UUID) -> MembershipRecordResponse:
        rows, _total = await self.repo.list_memberships(limit=500, offset=0)
        match = next(((membership, plan) for membership, plan in rows if membership.id == membership_id), None)
        if not match:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membership not found")
        membership, plan = match
        membership.end_date = datetime.now(timezone.utc).replace(tzinfo=None)
        await self.repo.session.commit()
        await self.repo.session.refresh(membership)
        return MembershipRecordResponse(
            id=membership.id,
            senior_id=membership.senior_id,
            plan_id=membership.plan_id,
            plan_name=plan.name,
            status=compute_membership_status(membership.start_date, membership.end_date),
            start_date=membership.start_date,
            end_date=membership.end_date,
        )

    async def _request_response(self, request_id: UUID) -> MembershipRequestResponse:
        refreshed = await self.repo.get_request_row(request_id)
        if not refreshed:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Membership request could not be loaded.",
            )
        request, senior, plan = refreshed
        return await self._to_request_response(request, senior, plan)

    async def _to_request_response(self, request, senior: Senior, plan) -> MembershipRequestResponse:
        care_name = None
        companion_name = None
        care_id = getattr(request, "care_manager_id", None)
        companion_id = getattr(request, "companion_id", None)
        if care_id:
            care_name = _care_display_name(await self.repo.get_care_manager(care_id))
        if companion_id:
            companion_name = _care_display_name(await self.repo.get_care_manager(companion_id))
        return MembershipRequestResponse(
            id=request.id,
            senior_id=request.senior_id,
            senior_name=_senior_name(senior),
            plan_id=plan.id,
            plan_name=plan.name or "",
            plan_price=_plan_price(plan),
            status=request.status,
            stage=getattr(request, "stage", None) or STAGE_SUBMITTED,
            notes=request.notes,
            family_contact_1_name=getattr(request, "family_contact_1_name", None),
            family_contact_1_phone=getattr(request, "family_contact_1_phone", None),
            family_contact_2_name=getattr(request, "family_contact_2_name", None),
            family_contact_2_phone=getattr(request, "family_contact_2_phone", None),
            emergency_contact_name=getattr(request, "emergency_contact_name", None),
            emergency_contact_phone=getattr(request, "emergency_contact_phone", None),
            preferred_hospital=getattr(request, "preferred_hospital", None),
            visit_planned_at=getattr(request, "visit_planned_at", None),
            visit_scheduled_start=getattr(request, "visit_scheduled_start", None),
            visit_scheduled_end=getattr(request, "visit_scheduled_end", None),
            visit_completed_at=getattr(request, "visit_completed_at", None),
            review_completed_at=getattr(request, "review_completed_at", None),
            accepted_at=getattr(request, "accepted_at", None),
            paid_at=getattr(request, "paid_at", None),
            care_manager_id=care_id,
            care_manager_name=care_name,
            companion_id=companion_id,
            companion_name=companion_name,
            created_at=request.created_at,
            reviewed_at=request.reviewed_at,
        )


def _senior_name(senior: Senior) -> Optional[str]:
    parts = [part for part in (senior.first_name, senior.last_name) if part]
    name = " ".join(parts).strip()
    return name or None


def _plan_price(plan) -> Optional[float]:
    if plan.price is None:
        return None
    return float(plan.price)
