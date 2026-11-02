from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_staff
from app.api.schemas import ListPage
from app.modules.access.repository import AccessRepository
from app.modules.access.service import AccessService
from app.modules.audit.repository import AuditRepository
from app.modules.seniors.repository import SeniorRepository
from app.modules.seniors.schemas import (
    SeniorCreate,
    SeniorDirectoryItem,
    SeniorPhotoUpdate,
    SeniorResponse,
    SeniorUpdate,
)
from app.modules.seniors.service import SeniorService, to_senior_response
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
    # FAMILY reads the linked senior (premium / service-area context).
    senior = await access.get_care_context_senior(current_user)
    return to_senior_response(senior)


@router.patch("/me", response_model=SeniorResponse)
async def update_my_senior_profile(
    payload: SeniorPhotoUpdate,
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: SeniorService = Depends(get_senior_service),
):
    senior = await access.get_senior_for_user(current_user)
    fields = payload.model_dump(exclude_unset=True)
    location_keys = ("location_lat", "location_lng", "location_query", "location_source")
    set_location = any(key in fields for key in location_keys)
    return await service.update_me(
        senior,
        set_photo="photo" in fields,
        photo=fields.get("photo"),
        set_address="address" in fields,
        address=fields.get("address"),
        set_in_service_area="in_service_area" in fields,
        in_service_area=fields.get("in_service_area"),
        set_location=set_location,
        location_lat=fields.get("location_lat"),
        location_lng=fields.get("location_lng"),
        location_query=fields.get("location_query"),
        location_source=fields.get("location_source"),
    )


@router.get("/", response_model=ListPage[SeniorDirectoryItem])
async def list_seniors(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    segment: str | None = Query(
        None,
        description="membership | outside_area | in_area_no_membership",
    ),
    service_city: str | None = Query(
        None,
        description="mumbai | chandrapur — super staff only; city staff stay scoped to their city",
    ),
    current_user: User = Depends(require_staff),
    service: SeniorService = Depends(get_senior_service),
):
    from app.modules.cities.catalog import normalize_city, staff_city

    scoped = staff_city(current_user)
    city = scoped if scoped else normalize_city(service_city)

    return await service.list_seniors(
        limit=limit, offset=offset, segment=segment, service_city=city
    )


@router.get("/by-user/{user_id}", response_model=SeniorDirectoryItem)
async def get_senior_by_user(
    user_id: str,
    current_user: User = Depends(require_staff),
    service: SeniorService = Depends(get_senior_service),
):
    return await service.get_senior_detail_by_user_id(user_id, actor=current_user)


@router.post("/", response_model=SeniorDirectoryItem)
async def create_senior(
    senior_in: SeniorCreate,
    current_user: User = Depends(require_staff),
    service: SeniorService = Depends(get_senior_service),
):
    return await service.create_senior(senior_in, actor=current_user)


@router.get("/{senior_id}", response_model=SeniorDirectoryItem)
async def get_senior(
    senior_id: str,
    current_user: User = Depends(get_current_user),
    service: SeniorService = Depends(get_senior_service),
    access: AccessService = Depends(get_access_service),
):
    await access.resolve_senior_id(current_user, senior_id)
    return await service.get_senior_detail(senior_id)


@router.patch("/{senior_id}", response_model=SeniorDirectoryItem)
async def update_senior(
    senior_id: str,
    payload: SeniorUpdate,
    current_user: User = Depends(require_staff),
    service: SeniorService = Depends(get_senior_service),
):
    return await service.update_senior(senior_id, payload, actor=current_user)


@router.delete("/{senior_id}", response_model=SeniorDirectoryItem)
async def delete_senior(
    senior_id: str,
    current_user: User = Depends(require_staff),
    service: SeniorService = Depends(get_senior_service),
):
    return await service.delete_senior(senior_id, actor=current_user)
