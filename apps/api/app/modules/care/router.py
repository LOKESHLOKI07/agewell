from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_staff
from app.modules.access.repository import AccessRepository
from app.modules.access.service import AccessService
from app.modules.audit.repository import AuditRepository
from app.modules.care.repository import CareManagerRepository
from app.modules.care.schemas import CareManagerCreate, CareManagerResponse, CareManagerUpdate
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
    return await service.list_care_managers(senior_id=scoped_senior_id)


@router.post("/", response_model=CareManagerResponse)
async def create_care_manager(
    payload: CareManagerCreate,
    _staff: User = Depends(require_staff),
    service: CareManagerService = Depends(get_care_service),
):
    return await service.create_care_manager(payload)


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
