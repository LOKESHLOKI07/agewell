from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_staff
from app.modules.access.repository import AccessRepository
from app.modules.access.service import AccessService
from app.modules.audit.repository import AuditRepository
from app.modules.care.repository import CareManagerRepository
from app.modules.care.schemas import (
    CareManagerApproval,
    CareManagerCreate,
    CareManagerResponse,
    CareManagerUpdate,
)
from app.modules.care.service import CareManagerService
from app.modules.seniors.repository import SeniorRepository
from app.modules.users.models import RoleEnum, User
from app.modules.users.repository import UserRepository

router = APIRouter()


def get_care_service(db: AsyncSession = Depends(get_db)):
    return CareManagerService(CareManagerRepository(db), UserRepository(db), AuditRepository(db))


def get_access_service(db: AsyncSession = Depends(get_db)):
    return AccessService(AccessRepository(db), SeniorRepository(db))


@router.get("/", response_model=list[CareManagerResponse])
async def list_care_managers(
    senior_id: Optional[UUID] = None,
    status: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: CareManagerService = Depends(get_care_service),
):
    if current_user.role == RoleEnum.CARE_MANAGER:
        profile = await service.get_by_user_id(current_user.id)
        return [profile] if profile else []

    scoped_senior_id = await access.resolve_senior_id(
        current_user, senior_id, allow_unscoped_staff=True
    )
    return await service.list_care_managers(senior_id=scoped_senior_id, status_filter=status)


@router.get("/by-user/{user_id}", response_model=CareManagerResponse)
async def get_care_manager_by_user(
    user_id: UUID,
    _staff: User = Depends(require_staff),
    service: CareManagerService = Depends(get_care_service),
):
    profile = await service.get_by_user_id(user_id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Care associate not found")
    return profile


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
    _staff: User = Depends(require_staff),
    service: CareManagerService = Depends(get_care_service),
):
    return await service.get_by_id(care_manager_id)


@router.patch("/{care_manager_id}", response_model=CareManagerResponse)
async def update_care_manager(
    care_manager_id: UUID,
    payload: CareManagerUpdate,
    _staff: User = Depends(require_staff),
    service: CareManagerService = Depends(get_care_service),
):
    return await service.update_care_manager(care_manager_id, payload)


@router.delete("/{care_manager_id}", response_model=CareManagerResponse)
async def delete_care_manager(
    care_manager_id: UUID,
    _staff: User = Depends(require_staff),
    service: CareManagerService = Depends(get_care_service),
):
    return await service.delete_care_manager(care_manager_id)
