from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_staff
from app.api.schemas import ListPage
from app.modules.access.repository import AccessRepository
from app.modules.access.service import AccessService
from app.modules.audit.repository import AuditRepository
from app.modules.seniors.repository import SeniorRepository
from app.modules.services.models import ServiceRequestStatus
from app.modules.services.repository import ServiceRepository
from app.modules.services.schemas import (
    ServiceCreate,
    ServiceRequestCreate,
    ServiceRequestRead,
    ServiceRequestResponse,
    ServiceRequestStatusUpdate,
    ServiceResponse,
    ServiceUpdate,
)
from app.modules.services.service import ServiceManager
from app.modules.users.models import User

router = APIRouter()


def get_service_manager(db: AsyncSession = Depends(get_db)):
    return ServiceManager(ServiceRepository(db), AuditRepository(db))


def get_access_service(db: AsyncSession = Depends(get_db)):
    return AccessService(AccessRepository(db), SeniorRepository(db))


@router.get("/", response_model=list[ServiceResponse])
async def list_services(
    _user: User = Depends(get_current_user),
    manager: ServiceManager = Depends(get_service_manager),
):
    return await manager.get_services()


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


@router.get("/requests", response_model=ListPage[ServiceRequestRead])
async def list_service_requests(
    senior_id: Optional[UUID] = None,
    status: Optional[ServiceRequestStatus] = None,
    service_id: Optional[UUID] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    manager: ServiceManager = Depends(get_service_manager),
):
    scoped_senior_id = await access.resolve_senior_id(
        current_user, senior_id, allow_unscoped_staff=True
    )
    return await manager.list_requests(
        senior_id=scoped_senior_id,
        status=status,
        service_id=service_id,
        limit=limit,
        offset=offset,
    )


@router.post("/requests", response_model=ServiceRequestResponse)
async def create_request(
    req: ServiceRequestCreate,
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    manager: ServiceManager = Depends(get_service_manager),
):
    scoped_senior_id = await access.resolve_senior_id(current_user, req.senior_id)
    return await manager.request_service(
        ServiceRequestCreate(senior_id=scoped_senior_id, service_id=req.service_id)
    )


@router.patch("/requests/{request_id}", response_model=ServiceRequestRead)
async def update_service_request(
    request_id: UUID,
    payload: ServiceRequestStatusUpdate,
    _staff: User = Depends(require_staff),
    manager: ServiceManager = Depends(get_service_manager),
):
    return await manager.update_request_status(request_id, payload.status)
