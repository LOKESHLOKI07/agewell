from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_staff
from app.api.schemas import ListPage
from app.modules.access.repository import AccessRepository
from app.modules.access.service import AccessService
from app.modules.memberships.repository import MembershipRepository
from app.modules.memberships.schemas import (
    CurrentMembershipResponse,
    MembershipBenefitResponse,
    MembershipPlanResponse,
    MembershipRecordResponse,
    MembershipRequestCreate,
    MembershipRequestResponse,
    MembershipRequestReview,
    MembershipRequestStatus,
    MembershipUsageItem,
)
from app.modules.memberships.service import MembershipService
from app.modules.seniors.repository import SeniorRepository
from app.modules.users.models import User

router = APIRouter()


def get_membership_service(db: AsyncSession = Depends(get_db)):
    return MembershipService(MembershipRepository(db))


def get_access_service(db: AsyncSession = Depends(get_db)):
    return AccessService(AccessRepository(db), SeniorRepository(db))


@router.get("/current", response_model=CurrentMembershipResponse)
async def get_current_membership(
    senior_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: MembershipService = Depends(get_membership_service),
):
    scoped_senior_id = await access.resolve_senior_id(current_user, senior_id)
    return await service.get_current_membership(scoped_senior_id)


@router.get("/current/usage", response_model=List[MembershipUsageItem])
async def get_current_membership_usage(
    senior_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: MembershipService = Depends(get_membership_service),
):
    scoped_senior_id = await access.resolve_senior_id(current_user, senior_id)
    return await service.get_current_usage(scoped_senior_id)


@router.get("/plans", response_model=ListPage[MembershipPlanResponse])
async def list_membership_plans(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    _staff: User = Depends(require_staff),
    service: MembershipService = Depends(get_membership_service),
):
    return await service.list_plans(limit=limit, offset=offset)


@router.get("/benefits", response_model=ListPage[MembershipBenefitResponse])
async def list_membership_benefits(
    plan_id: Optional[UUID] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    _staff: User = Depends(require_staff),
    service: MembershipService = Depends(get_membership_service),
):
    return await service.list_benefits(plan_id=plan_id, limit=limit, offset=offset)


@router.get("/records", response_model=ListPage[MembershipRecordResponse])
async def list_membership_records(
    senior_id: Optional[UUID] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    _staff: User = Depends(require_staff),
    service: MembershipService = Depends(get_membership_service),
):
    return await service.list_memberships(senior_id=senior_id, limit=limit, offset=offset)


@router.post("/requests", response_model=MembershipRequestResponse)
async def create_membership_request(
    payload: MembershipRequestCreate,
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: MembershipService = Depends(get_membership_service),
):
    scoped_senior_id = await access.resolve_senior_id(current_user, payload.senior_id)
    if scoped_senior_id is None:
        raise HTTPException(status_code=400, detail="senior_id is required")
    return await service.create_request(scoped_senior_id, payload)


@router.get("/requests", response_model=ListPage[MembershipRequestResponse])
async def list_membership_requests(
    senior_id: Optional[UUID] = None,
    status: Optional[MembershipRequestStatus] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: MembershipService = Depends(get_membership_service),
):
    scoped_senior_id = await access.resolve_senior_id(current_user, senior_id, allow_unscoped_staff=True)
    return await service.list_requests(
        senior_id=scoped_senior_id,
        status=status.value if status else None,
        limit=limit,
        offset=offset,
    )


@router.patch("/requests/{request_id}", response_model=MembershipRequestResponse)
async def review_membership_request(
    request_id: UUID,
    payload: MembershipRequestReview,
    _staff: User = Depends(require_staff),
    service: MembershipService = Depends(get_membership_service),
):
    return await service.review_request(request_id, payload.status)
