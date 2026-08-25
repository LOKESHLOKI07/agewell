from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_staff
from app.api.schemas import ListPage
from app.modules.access.repository import AccessRepository
from app.modules.access.service import AccessService
from app.modules.audit.repository import AuditRepository
from app.modules.seniors.repository import SeniorRepository
from app.modules.seniors.schemas import SeniorCreate, SeniorDirectoryItem, SeniorResponse
from app.modules.seniors.service import SeniorService
from app.modules.users.models import User
from app.modules.users.repository import UserRepository

router = APIRouter()


def get_senior_service(db: AsyncSession = Depends(get_db)):
    return SeniorService(SeniorRepository(db), UserRepository(db), AuditRepository(db))


def get_access_service(db: AsyncSession = Depends(get_db)):
    return AccessService(AccessRepository(db), SeniorRepository(db))


@router.get("/me", response_model=SeniorResponse)
async def get_my_senior_profile(
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
):
    return await access.get_senior_for_user(current_user)


@router.get("/", response_model=ListPage[SeniorDirectoryItem])
async def list_seniors(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    _staff: User = Depends(require_staff),
    service: SeniorService = Depends(get_senior_service),
):
    return await service.list_seniors(limit=limit, offset=offset)


@router.post("/", response_model=SeniorResponse)
async def create_senior(
    senior_in: SeniorCreate,
    _staff: User = Depends(require_staff),
    service: SeniorService = Depends(get_senior_service),
):
    return await service.create_senior(senior_in)


@router.get("/{senior_id}", response_model=SeniorResponse)
async def get_senior(
    senior_id: str,
    current_user: User = Depends(get_current_user),
    service: SeniorService = Depends(get_senior_service),
    access: AccessService = Depends(get_access_service),
):
    await access.resolve_senior_id(current_user, senior_id)
    senior = await service.get_senior(senior_id)
    if not senior:
        raise HTTPException(status_code=404, detail="Senior not found")
    return senior
