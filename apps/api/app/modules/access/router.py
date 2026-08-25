from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_staff
from app.api.schemas import ListPage
from app.modules.access.repository import AccessRepository
from app.modules.access.schemas import FamilySeniorAccessCreate, FamilySeniorAccessResponse
from app.modules.access.service import FamilyAccessAdminService
from app.modules.audit.repository import AuditRepository
from app.modules.families.repository import FamilyRepository
from app.modules.seniors.repository import SeniorRepository
from app.modules.users.models import User

router = APIRouter()


def get_access_admin_service(db: AsyncSession = Depends(get_db)):
    return FamilyAccessAdminService(
        AccessRepository(db),
        SeniorRepository(db),
        FamilyRepository(db),
        AuditRepository(db),
    )


@router.get("/", response_model=ListPage[FamilySeniorAccessResponse])
async def list_access(
    family_id: Optional[UUID] = None,
    senior_id: Optional[UUID] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    _staff: User = Depends(require_staff),
    service: FamilyAccessAdminService = Depends(get_access_admin_service),
):
    return await service.list_access(family_id=family_id, senior_id=senior_id, limit=limit, offset=offset)


@router.post("/", response_model=FamilySeniorAccessResponse)
async def create_access(
    payload: FamilySeniorAccessCreate,
    _staff: User = Depends(require_staff),
    service: FamilyAccessAdminService = Depends(get_access_admin_service),
):
    return await service.create_access(payload.family_id, payload.senior_id)


@router.delete("/{access_id}", response_model=FamilySeniorAccessResponse)
async def delete_access(
    access_id: UUID,
    _staff: User = Depends(require_staff),
    service: FamilyAccessAdminService = Depends(get_access_admin_service),
):
    row = await service.delete_access(access_id)
    return row
