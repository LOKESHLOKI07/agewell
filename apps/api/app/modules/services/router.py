from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_care_or_staff, require_staff
from app.api.schemas import ListPage
from app.modules.access.repository import AccessRepository
from app.modules.access.service import AccessService
from app.modules.audit.repository import AuditRepository
from app.modules.seniors.repository import SeniorRepository
from app.modules.services.models import ServiceRequestStatus
from app.modules.services.repository import ServiceRepository
from app.modules.services.schemas import (
    ServiceCreate,
    ServiceRequestAssign,
    ServiceRequestAssignServiceCompanion,
    ServiceRequestCreate,
    ServiceRequestRead,
    ServiceRequestResponse,
    ServiceRequestStatusUpdate,
    ServiceResponse,
    ServiceUpdate,
)
from app.modules.services.service import ServiceManager
from app.modules.services.service_policy import ROLE_CARE_MANAGER, ROLE_COMPANION, policy_role_for_staff_kind
from app.modules.users.models import RoleEnum, User

router = APIRouter()


def get_service_manager(db: AsyncSession = Depends(get_db)):
    return ServiceManager(ServiceRepository(db), AuditRepository(db))


def get_access_service(db: AsyncSession = Depends(get_db)):
    return AccessService(AccessRepository(db), SeniorRepository(db))


async def ensure_can_manage_assignments(user: User, access: AccessService) -> None:
    if user.role in (RoleEnum.ADMIN, RoleEnum.OPERATIONS):
        return
    if user.role == RoleEnum.CARE_MANAGER:
        care = await access.access_repo.get_care_manager_by_user_id(user.id)
        if care and policy_role_for_staff_kind(care.staff_kind) == ROLE_CARE_MANAGER:
            return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only Care Managers and staff can manage service assignments.",
    )


@router.get("/", response_model=list[ServiceResponse])
async def list_services(
    _user: User = Depends(get_current_user),
    manager: ServiceManager = Depends(get_service_manager),
):
    return await manager.get_services()


@router.get("/by-slug/{slug}", response_model=ServiceResponse)
async def get_service_by_slug(
    slug: str,
    _user: User = Depends(get_current_user),
    manager: ServiceManager = Depends(get_service_manager),
):
    return await manager.get_service_by_slug(slug)


@router.post("/", response_model=ServiceResponse)
async def create_service(
    item: ServiceCreate,
    _staff: User = Depends(require_staff),
    manager: ServiceManager = Depends(get_service_manager),
):
    return await manager.create_service(item)


@router.patch("/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: UUID,
    payload: ServiceUpdate,
    _staff: User = Depends(require_staff),
    manager: ServiceManager = Depends(get_service_manager),
):
    return await manager.update_service(service_id, payload)


@router.get("/requests/unassigned-counts", response_model=dict[str, int])
async def unassigned_service_request_counts(
    current_user: User = Depends(require_care_or_staff),
    access: AccessService = Depends(get_access_service),
    manager: ServiceManager = Depends(get_service_manager),
):
    await ensure_can_manage_assignments(current_user, access)
    from app.modules.cities.catalog import staff_city

    return await manager.unassigned_counts(service_city=staff_city(current_user))


@router.get("/requests", response_model=ListPage[ServiceRequestRead])
async def list_service_requests(
    senior_id: Optional[UUID] = None,
    status: Optional[ServiceRequestStatus] = None,
    service_id: Optional[UUID] = None,
    service_slug: Optional[str] = None,
    awaiting_dispatch: Optional[bool] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    manager: ServiceManager = Depends(get_service_manager),
):
    from app.modules.cities.catalog import staff_city

    dispatcher_id = None
    scoped_senior_id = None
    if current_user.role == RoleEnum.CARE_MANAGER:
        care = await access.access_repo.get_care_manager_by_user_id(current_user.id)
        kind = policy_role_for_staff_kind(care.staff_kind) if care else None
        if kind == ROLE_CARE_MANAGER:
            scoped_senior_id = None
        elif awaiting_dispatch and care:
            dispatcher_id = care.id
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Care Managers can list all service requests.",
            )
    else:
        scoped_senior_id = await access.resolve_senior_id(
            current_user, senior_id, allow_unscoped_staff=True
        )

    return await manager.list_requests(
        senior_id=scoped_senior_id,
        status=status,
        service_id=service_id,
        service_slug=service_slug,
        service_city=staff_city(current_user),
        dispatcher_id=dispatcher_id,
        awaiting_dispatch=True if awaiting_dispatch else None,
        limit=limit,
        offset=offset,
    )


@router.post("/requests", response_model=ServiceRequestRead)
async def create_request(
    req: ServiceRequestCreate,
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    manager: ServiceManager = Depends(get_service_manager),
):
    scoped_senior_id = await access.resolve_senior_id(current_user, req.senior_id)
    return await manager.request_service(
        ServiceRequestCreate(
            senior_id=scoped_senior_id,
            service_id=req.service_id,
            notes=req.notes,
        )
    )


@router.post("/requests/{request_id}/auto-assign", response_model=ServiceRequestRead)
async def auto_assign_service_request(
    request_id: UUID,
    current_user: User = Depends(require_care_or_staff),
    access: AccessService = Depends(get_access_service),
    manager: ServiceManager = Depends(get_service_manager),
):
    await ensure_can_manage_assignments(current_user, access)
    return await manager.auto_assign_standing(request_id, actor=current_user)


@router.patch("/requests/{request_id}", response_model=ServiceRequestRead)
async def update_service_request(
    request_id: UUID,
    payload: ServiceRequestStatusUpdate,
    _staff: User = Depends(require_care_or_staff),
    manager: ServiceManager = Depends(get_service_manager),
):
    return await manager.update_request_status(
        request_id,
        payload.status,
        actor=_staff,
        proof_photo=payload.proof_photo,
    )


@router.post("/requests/{request_id}/assign", response_model=ServiceRequestRead)
async def assign_service_request(
    request_id: UUID,
    payload: ServiceRequestAssign,
    current_user: User = Depends(require_care_or_staff),
    access: AccessService = Depends(get_access_service),
    manager: ServiceManager = Depends(get_service_manager),
):
    await ensure_can_manage_assignments(current_user, access)
    return await manager.assign_request(
        request_id,
        payload.resolved_ids(),
        actor=current_user,
    )


@router.post("/requests/{request_id}/take", response_model=ServiceRequestRead)
async def take_service_request(
    request_id: UUID,
    current_user: User = Depends(require_care_or_staff),
    manager: ServiceManager = Depends(get_service_manager),
):
    return await manager.take_request(request_id, actor=current_user)


@router.post("/requests/{request_id}/assign-service-companion", response_model=ServiceRequestRead)
async def assign_service_companion(
    request_id: UUID,
    payload: ServiceRequestAssignServiceCompanion,
    current_user: User = Depends(require_care_or_staff),
    manager: ServiceManager = Depends(get_service_manager),
):
    return await manager.assign_service_companion(
        request_id,
        payload.care_manager_id,
        actor=current_user,
    )
