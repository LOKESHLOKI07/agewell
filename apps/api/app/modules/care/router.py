from datetime import date as date_type
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_care_or_staff, require_staff
from app.api.schemas import ListPage
from app.modules.access.repository import AccessRepository
from app.modules.access.service import AccessService
from app.modules.audit.repository import AuditRepository
from app.modules.care.activity_service import CareActivityService
from app.modules.care.repository import CareManagerRepository
from app.modules.care.schemas import (
    AssignedCareManagerResponse,
    CareActivityResponse,
    CareActivityUpdate,
    CareCallCreate,
    CareManagerApproval,
    CareManagerCreate,
    CareManagerResponse,
    CareManagerUpdate,
    CareMessageCreate,
    CareVisitCreate,
    CareVisitSlotsResponse,
    StaffProvisionRequest,
)
from app.modules.care.service import CareManagerService
from app.modules.notifications.repository import NotificationRepository
from app.modules.seniors.repository import SeniorRepository
from app.modules.users.models import RoleEnum, User
from app.modules.users.repository import UserRepository

router = APIRouter()


def get_care_service(db: AsyncSession = Depends(get_db)):
    return CareManagerService(CareManagerRepository(db), UserRepository(db), AuditRepository(db))


def get_access_service(db: AsyncSession = Depends(get_db)):
    return AccessService(AccessRepository(db), SeniorRepository(db))


def get_activity_service(db: AsyncSession = Depends(get_db)):
    return CareActivityService(
        CareManagerRepository(db),
        SeniorRepository(db),
        AccessRepository(db),
        NotificationRepository(db),
        AuditRepository(db),
    )


@router.get("/", response_model=list[CareManagerResponse])
async def list_care_managers(
    senior_id: Optional[UUID] = None,
    status: Optional[str] = Query(None, alias="status"),
    for_assign: bool = Query(False),
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: CareManagerService = Depends(get_care_service),
):
    from app.modules.cities.catalog import staff_city
    from app.modules.services.service_policy import (
        ROLE_CARE_MANAGER,
        ROLE_COMPANION,
        ROLE_SERVICE_COMPANION,
        policy_role_for_staff_kind,
    )

    if current_user.role == RoleEnum.CARE_MANAGER:
        profile = await service.get_by_user_id(current_user.id)
        if not profile:
            return []
        if for_assign:
            actor_role = policy_role_for_staff_kind(profile.staff_kind)
            rows = await service.list_care_managers(
                status_filter="ACTIVE",
                service_city=staff_city(current_user),
            )
            if actor_role == ROLE_CARE_MANAGER:
                return [
                    row
                    for row in rows
                    if policy_role_for_staff_kind(row.staff_kind)
                    in (ROLE_COMPANION, ROLE_SERVICE_COMPANION)
                ]
            if actor_role == ROLE_COMPANION:
                return [
                    row
                    for row in rows
                    if policy_role_for_staff_kind(row.staff_kind) == ROLE_SERVICE_COMPANION
                ]
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Care Managers or Companions can list staff to assign.",
            )
        return [profile]

    scoped_senior_id = await access.resolve_senior_id(
        current_user, senior_id, allow_unscoped_staff=True
    )

    return await service.list_care_managers(
        senior_id=scoped_senior_id,
        status_filter=status,
        service_city=staff_city(current_user),
    )


@router.get("/assigned", response_model=AssignedCareManagerResponse)
async def get_assigned_care_manager(
    senior_id: Optional[UUID] = None,
    staff_kind: Optional[str] = Query(None, alias="staff_kind"),
    current_user: User = Depends(get_current_user),
    service: CareActivityService = Depends(get_activity_service),
):
    return await service.get_assigned(current_user, senior_id, staff_kind=staff_kind)


@router.get("/visit-slots", response_model=CareVisitSlotsResponse)
async def list_care_visit_slots(
    on_date: date_type = Query(..., alias="date"),
    senior_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    service: CareActivityService = Depends(get_activity_service),
):
    return await service.visit_slots(current_user, on_date, senior_id)


@router.get("/activities", response_model=ListPage[CareActivityResponse])
async def list_care_activities(
    senior_id: Optional[UUID] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    service: CareActivityService = Depends(get_activity_service),
):
    return await service.list_activities(current_user, senior_id=senior_id, limit=limit, offset=offset)


@router.post("/activities/call", response_model=CareActivityResponse)
async def create_care_call(
    payload: CareCallCreate | None = None,
    current_user: User = Depends(get_current_user),
    service: CareActivityService = Depends(get_activity_service),
):
    senior_id = payload.senior_id if payload else None
    return await service.create_call(current_user, senior_id)


@router.post("/activities/message", response_model=CareActivityResponse)
async def create_care_message(
    payload: CareMessageCreate | None = None,
    current_user: User = Depends(get_current_user),
    service: CareActivityService = Depends(get_activity_service),
):
    senior_id = payload.senior_id if payload else None
    return await service.create_message(current_user, senior_id)


@router.post("/activities/visit", response_model=CareActivityResponse)
async def create_care_visit_request(
    payload: CareVisitCreate,
    current_user: User = Depends(get_current_user),
    service: CareActivityService = Depends(get_activity_service),
):
    return await service.create_visit(current_user, payload.scheduled_at, payload.reason, payload.senior_id)


@router.patch("/activities/{activity_id}", response_model=CareActivityResponse)
async def update_care_activity(
    activity_id: UUID,
    payload: CareActivityUpdate,
    _staff: User = Depends(require_care_or_staff),
    current_user: User = Depends(get_current_user),
    service: CareActivityService = Depends(get_activity_service),
):
    return await service.update_activity(current_user, activity_id, payload)


@router.get("/by-user/{user_id}", response_model=CareManagerResponse)
async def get_care_manager_by_user(
    user_id: UUID,
    current_user: User = Depends(require_staff),
    service: CareManagerService = Depends(get_care_service),
):
    from app.modules.cities.catalog import ensure_staff_can_see_user

    profile = await service.get_by_user_id(user_id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Care associate not found")
    user = await service.user_repo.get_by_id(user_id) if service.user_repo else None
    ensure_staff_can_see_user(current_user, user)
    return profile


@router.post("/provision", response_model=CareManagerResponse)
async def provision_staff(
    payload: StaffProvisionRequest,
    current_user: User = Depends(require_staff),
    service: CareManagerService = Depends(get_care_service),
):
    return await service.provision_staff(payload, actor=current_user)


@router.post("/", response_model=CareManagerResponse)
async def create_care_manager(
    payload: CareManagerCreate,
    _staff: User = Depends(require_staff),
    service: CareManagerService = Depends(get_care_service),
):
    return await service.create_care_manager(payload)


@router.post("/{care_manager_id}/approve", response_model=CareManagerResponse)
async def approve_care_manager(
    care_manager_id: UUID,
    payload: CareManagerApproval,
    _staff: User = Depends(require_staff),
    service: CareManagerService = Depends(get_care_service),
):
    return await service.approve_care_manager(care_manager_id, payload)


@router.get("/{care_manager_id}", response_model=CareManagerResponse)
async def get_care_manager(
    care_manager_id: UUID,
    current_user: User = Depends(require_staff),
    service: CareManagerService = Depends(get_care_service),
):
    return await service.get_by_id(care_manager_id, actor=current_user)


@router.patch("/{care_manager_id}", response_model=CareManagerResponse)
async def update_care_manager(
    care_manager_id: UUID,
    payload: CareManagerUpdate,
    current_user: User = Depends(require_staff),
    service: CareManagerService = Depends(get_care_service),
):
    await service.get_by_id(care_manager_id, actor=current_user)
    return await service.update_care_manager(care_manager_id, payload)


@router.delete("/{care_manager_id}", response_model=CareManagerResponse)
async def delete_care_manager(
    care_manager_id: UUID,
    current_user: User = Depends(require_staff),
    service: CareManagerService = Depends(get_care_service),
):
    await service.get_by_id(care_manager_id, actor=current_user)
    return await service.delete_care_manager(care_manager_id)
