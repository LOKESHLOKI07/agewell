from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
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
