from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_staff
from app.api.schemas import ListPage
from app.modules.families.repository import FamilyRepository
from app.modules.families.schemas import FamilyMemberResponse
from app.modules.families.service import FamilyService
from app.modules.seniors.schemas import SeniorResponse
from app.modules.users.models import User

router = APIRouter()


def get_family_service(db: AsyncSession = Depends(get_db)):
    return FamilyService(FamilyRepository(db))


@router.get("/me", response_model=FamilyMemberResponse)
async def get_my_family_profile(
    current_user: User = Depends(get_current_user),
    service: FamilyService = Depends(get_family_service),
):
    return await service.get_me(current_user)


@router.get("/seniors", response_model=list[SeniorResponse])
async def list_authorized_seniors(
    current_user: User = Depends(get_current_user),
    service: FamilyService = Depends(get_family_service),
):
    return await service.list_authorized_seniors(current_user)


@router.get("/", response_model=ListPage[FamilyMemberResponse])
async def list_families(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    _staff: User = Depends(require_staff),
    service: FamilyService = Depends(get_family_service),
):
    return await service.list_families(limit=limit, offset=offset)
