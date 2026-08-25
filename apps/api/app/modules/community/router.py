from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_staff
from app.api.schemas import ListPage
from app.modules.access.repository import AccessRepository
from app.modules.access.service import FORBIDDEN, AccessService
from app.modules.audit.repository import AuditRepository
from app.modules.community.repository import CommunityRepository
from app.modules.community.schemas import (
    CommunityEventCreate,
    CommunityEventResponse,
    CommunityEventUpdate,
    EventRegistrationCreate,
    EventRegistrationResponse,
    EventRegistrationUpdate,
)
from app.modules.community.service import CommunityService
from app.modules.families.repository import FamilyRepository
from app.modules.seniors.repository import SeniorRepository
from app.modules.users.models import RoleEnum, User

router = APIRouter()

COMMUNITY_READ_ROLES = {RoleEnum.SENIOR, RoleEnum.FAMILY, RoleEnum.ADMIN, RoleEnum.OPERATIONS}


def get_community_service(db: AsyncSession = Depends(get_db)):
    return CommunityService(CommunityRepository(db), AuditRepository(db))


def get_access_service(db: AsyncSession = Depends(get_db)):
    return AccessService(AccessRepository(db), SeniorRepository(db))


def get_senior_repo(db: AsyncSession = Depends(get_db)):
    return SeniorRepository(db)


def get_family_repo(db: AsyncSession = Depends(get_db)):
    return FamilyRepository(db)


def ensure_community_reader(user: User) -> None:
    if user.role not in COMMUNITY_READ_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)


async def authorized_registration_user_ids(
    user: User,
    family_repo: FamilyRepository,
) -> Optional[list[UUID]]:
    if user.role == RoleEnum.SENIOR:
        return [user.id]
    if user.role == RoleEnum.FAMILY:
        family = await family_repo.get_by_user_id(user.id)
        if not family:
            return []
        seniors = await family_repo.list_authorized_seniors(family.id)
        return [senior.user_id for senior in seniors if senior.user_id is not None]
    if user.role in (RoleEnum.ADMIN, RoleEnum.OPERATIONS):
        return None
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)


async def resolve_registration_user_id(
    user: User,
    payload: EventRegistrationCreate,
    access: AccessService,
    senior_repo: SeniorRepository,
) -> UUID:
    if user.role == RoleEnum.SENIOR:
        return user.id
    if user.role == RoleEnum.FAMILY:
        senior_id = await access.resolve_senior_id(user, payload.senior_id)
        senior = await senior_repo.get_by_id(senior_id)
        if not senior or senior.user_id is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Senior not found")
        return senior.user_id
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)


async def ensure_registration_access(
    user: User,
    registration_user_id: UUID,
    family_repo: FamilyRepository,
) -> None:
    if user.role == RoleEnum.SENIOR:
        if registration_user_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
        return
    if user.role == RoleEnum.FAMILY:
        allowed = await authorized_registration_user_ids(user, family_repo)
        if registration_user_id not in (allowed or []):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)


@router.get("/", response_model=ListPage[CommunityEventResponse])
async def list_events(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(get_community_service),
):
    ensure_community_reader(current_user)
    return await service.list_events(limit=limit, offset=offset)


@router.post("/", response_model=CommunityEventResponse)
async def create_event(
    payload: CommunityEventCreate,
    _staff: User = Depends(require_staff),
    service: CommunityService = Depends(get_community_service),
):
    return await service.create_event(payload)


@router.get("/registrations", response_model=ListPage[EventRegistrationResponse])
async def list_registrations(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    family_repo: FamilyRepository = Depends(get_family_repo),
    service: CommunityService = Depends(get_community_service),
):
    user_ids = await authorized_registration_user_ids(current_user, family_repo)
    return await service.list_registrations(user_ids=user_ids, limit=limit, offset=offset)


@router.patch("/registrations/{registration_id}", response_model=EventRegistrationResponse)
async def update_registration(
    registration_id: UUID,
    payload: EventRegistrationUpdate,
    current_user: User = Depends(get_current_user),
    family_repo: FamilyRepository = Depends(get_family_repo),
    service: CommunityService = Depends(get_community_service),
):
    registration, _existing = await service.get_registration(registration_id)
    await ensure_registration_access(current_user, registration.user_id, family_repo)
    return await service.update_registration(registration, payload)


@router.post("/{event_id}/register", response_model=EventRegistrationResponse)
async def register_for_event(
    event_id: UUID,
    payload: EventRegistrationCreate,
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    senior_repo: SeniorRepository = Depends(get_senior_repo),
    service: CommunityService = Depends(get_community_service),
):
    user_id = await resolve_registration_user_id(current_user, payload, access, senior_repo)
    return await service.register(event_id, user_id)


@router.get("/{event_id}", response_model=CommunityEventResponse)
async def get_event(
    event_id: UUID,
    current_user: User = Depends(get_current_user),
    service: CommunityService = Depends(get_community_service),
):
    ensure_community_reader(current_user)
    return await service.get_event_response(event_id)


@router.patch("/{event_id}", response_model=CommunityEventResponse)
async def update_event(
    event_id: UUID,
    payload: CommunityEventUpdate,
    _staff: User = Depends(require_staff),
    service: CommunityService = Depends(get_community_service),
):
    return await service.update_event(event_id, payload)


@router.delete("/{event_id}", response_model=CommunityEventResponse)
async def delete_event(
    event_id: UUID,
    _staff: User = Depends(require_staff),
    service: CommunityService = Depends(get_community_service),
):
    return await service.delete_event(event_id)
