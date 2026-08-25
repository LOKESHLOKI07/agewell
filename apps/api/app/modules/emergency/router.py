from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_staff
from app.api.schemas import ListPage
from app.modules.access.repository import AccessRepository
from app.modules.access.service import AccessService
from app.modules.emergency.models import EmergencyStatus, EmergencyType
from app.modules.emergency.repository import EmergencyRepository
from app.modules.emergency.schemas import EmergencyCaseResponse, EmergencyCreate, EmergencyEventResponse, EmergencyStatusUpdate
from app.modules.emergency.service import EmergencyService, to_case_response
from app.modules.notifications.repository import NotificationRepository
from app.modules.seniors.repository import SeniorRepository
from app.modules.users.models import User
from app.modules.audit.repository import AuditRepository

router = APIRouter()


def get_emergency_service(db: AsyncSession = Depends(get_db)):
    return EmergencyService(
        EmergencyRepository(db),
        NotificationRepository(db),
        AccessRepository(db),
        SeniorRepository(db),
        AuditRepository(db),
    )


def get_access_service(db: AsyncSession = Depends(get_db)):
    return AccessService(AccessRepository(db), SeniorRepository(db))


@router.get("/", response_model=ListPage[EmergencyCaseResponse])
async def list_emergency_cases(
    senior_id: Optional[UUID] = None,
    status: Optional[EmergencyStatus] = None,
    emergency_type: Optional[EmergencyType] = Query(None, alias="type"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: EmergencyService = Depends(get_emergency_service),
):
    scope = await access.resolve_emergency_list_scope(current_user, senior_id)
    return await service.list_cases(
        senior_id=scope.senior_id,
        assigned_senior_ids=scope.assigned_senior_ids,
        status=status,
        emergency_type=emergency_type,
        limit=limit,
        offset=offset,
    )


@router.post("/", response_model=EmergencyCaseResponse)
async def create_emergency_case(
    payload: EmergencyCreate,
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: EmergencyService = Depends(get_emergency_service),
):
    senior_id = await access.resolve_emergency_senior_id(current_user, payload.senior_id)
    return await service.create_case(payload, senior_id)


@router.get("/{emergency_id}/events", response_model=ListPage[EmergencyEventResponse])
async def list_emergency_events(
    emergency_id: UUID,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: EmergencyService = Depends(get_emergency_service),
):
    case = await service.get_case(emergency_id)
    await access.ensure_emergency_access(current_user, case.senior_id)
    return await service.list_events(emergency_id, limit=limit, offset=offset)


@router.get("/{emergency_id}", response_model=EmergencyCaseResponse)
async def get_emergency_case(
    emergency_id: UUID,
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: EmergencyService = Depends(get_emergency_service),
):
    case = await service.get_case(emergency_id)
    await access.ensure_emergency_access(current_user, case.senior_id)
    return to_case_response(case)


@router.patch("/{emergency_id}", response_model=EmergencyCaseResponse)
async def update_emergency_status(
    emergency_id: UUID,
    payload: EmergencyStatusUpdate,
    _staff: User = Depends(require_staff),
    service: EmergencyService = Depends(get_emergency_service),
):
    return await service.update_status(emergency_id, payload.status)
