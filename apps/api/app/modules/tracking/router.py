from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.schemas import ListPage
from app.modules.access.repository import AccessRepository
from app.modules.access.service import FORBIDDEN, AccessService
from app.modules.seniors.repository import SeniorRepository
from app.modules.tracking.repository import TrackingRepository
from app.modules.tracking.schemas import (
    CareAssociateLatestLocationResponse,
    CareAssociateTrackingPointCreate,
    CareAssociateTrackingPointResponse,
    CareAssociateTrackingSessionCreate,
    CareAssociateTrackingSessionResponse,
    TrackingPointCreate,
    TrackingPointResponse,
    TrackingSessionCreate,
    TrackingSessionResponse,
)
from app.modules.tracking.service import TrackingService
from app.modules.users.models import RoleEnum, User
from app.modules.visits.repository import VisitRepository

router = APIRouter()


def get_tracking_service(db: AsyncSession = Depends(get_db)):
    return TrackingService(TrackingRepository(db), VisitRepository(db))


def get_access_service(db: AsyncSession = Depends(get_db)):
    return AccessService(AccessRepository(db), SeniorRepository(db))


def get_senior_repo(db: AsyncSession = Depends(get_db)):
    return SeniorRepository(db)


def get_access_repo(db: AsyncSession = Depends(get_db)):
    return AccessRepository(db)


async def tracked_user_ids_for_list(
    user: User,
    senior_id: Optional[UUID],
    access: AccessService,
    senior_repo: SeniorRepository,
    access_repo: AccessRepository,
) -> Optional[list[UUID]]:
    if user.role == RoleEnum.SENIOR:
        if senior_id:
            await access.resolve_senior_id(user, senior_id)
        return [user.id]

    if user.role == RoleEnum.FAMILY:
        scoped_senior_id = await access.resolve_senior_id(user, senior_id)
        senior = await senior_repo.get_by_id(scoped_senior_id)
        if not senior or senior.user_id is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Senior not found")
        return [senior.user_id]

    if user.role == RoleEnum.CARE_MANAGER:
        if senior_id:
            scope = await access.resolve_visit_list_scope(user, senior_id)
            if scope.senior_id is None:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
            senior = await senior_repo.get_by_id(scope.senior_id)
            if not senior or senior.user_id is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Senior not found")
            return [senior.user_id]
        care_manager = await access_repo.get_care_manager_by_user_id(user.id)
        if not care_manager:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
        assigned = await access_repo.list_assigned_senior_ids(care_manager.id)
        user_ids = []
        for assigned_senior_id in assigned:
            senior = await senior_repo.get_by_id(assigned_senior_id)
            if senior and senior.user_id is not None:
                user_ids.append(senior.user_id)
        return user_ids

    if user.role in (RoleEnum.ADMIN, RoleEnum.OPERATIONS):
        if senior_id:
            senior = await senior_repo.get_by_id(senior_id)
            if not senior:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Senior not found")
            return [senior.user_id] if senior.user_id is not None else []
        return None

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)


async def ensure_session_read_access(
    user: User,
    session_user_id: Optional[UUID],
    access: AccessService,
    senior_repo: SeniorRepository,
) -> None:
    if session_user_id is not None and session_user_id == user.id:
        return
    if user.role in (RoleEnum.ADMIN, RoleEnum.OPERATIONS):
        return
    if session_user_id is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
    senior = await senior_repo.get_by_user_id(session_user_id)
    if not senior:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
    if user.role == RoleEnum.FAMILY:
        await access.resolve_senior_id(user, senior.id)
        return
    if user.role == RoleEnum.CARE_MANAGER:
        scope = await access.resolve_visit_list_scope(user, senior.id)
        if scope.senior_id is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)


def ensure_session_write_access(user: User, session_user_id: Optional[UUID]) -> None:
    if session_user_id is None or session_user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)


def ensure_care_manager(user: User) -> None:
    if user.role != RoleEnum.CARE_MANAGER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)


@router.post("/care-associate/", response_model=CareAssociateTrackingSessionResponse)
async def create_care_associate_session(
    payload: CareAssociateTrackingSessionCreate,
    current_user: User = Depends(get_current_user),
    access_repo: AccessRepository = Depends(get_access_repo),
    service: TrackingService = Depends(get_tracking_service),
):
    _ = payload
    ensure_care_manager(current_user)
    care_manager = await access_repo.get_care_manager_by_user_id(current_user.id)
    if not care_manager:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
    return await service.get_or_create_session_for_user(current_user.id)


@router.post(
    "/care-associate/{session_id}/points",
    response_model=CareAssociateTrackingPointResponse,
)
async def create_care_associate_point(
    session_id: UUID,
    payload: CareAssociateTrackingPointCreate,
    current_user: User = Depends(get_current_user),
    service: TrackingService = Depends(get_tracking_service),
):
    ensure_care_manager(current_user)
    session = await service.get_session(session_id)
    ensure_session_write_access(current_user, session.user_id)
    return await service.create_care_associate_point(session_id, payload)


@router.get(
    "/visits/{visit_id}/care-associate/latest",
    response_model=CareAssociateLatestLocationResponse,
)
async def get_visit_care_associate_latest(
    visit_id: UUID,
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: TrackingService = Depends(get_tracking_service),
):
    return await service.get_visit_care_associate_latest(visit_id, current_user, access)


@router.get(
    "/visits/{visit_id}/care-associate/points",
    response_model=ListPage[CareAssociateTrackingPointResponse],
)
async def list_visit_care_associate_points(
    visit_id: UUID,
    limit: int = Query(..., ge=1, le=100),
    offset: int = Query(..., ge=0),
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: TrackingService = Depends(get_tracking_service),
):
    return await service.list_visit_care_associate_points(
        visit_id, current_user, access, limit=limit, offset=offset
    )


@router.get("/visits/{visit_id}/care-associate", response_model=CareAssociateTrackingSessionResponse)
async def get_visit_care_associate_session(
    visit_id: UUID,
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: TrackingService = Depends(get_tracking_service),
):
    return await service.get_visit_care_associate_session(visit_id, current_user, access)


@router.get("/", response_model=ListPage[TrackingSessionResponse])
async def list_sessions(
    senior_id: Optional[UUID] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    senior_repo: SeniorRepository = Depends(get_senior_repo),
    access_repo: AccessRepository = Depends(get_access_repo),
    service: TrackingService = Depends(get_tracking_service),
):
    user_ids = await tracked_user_ids_for_list(
        current_user, senior_id, access, senior_repo, access_repo
    )
    return await service.list_sessions(user_ids=user_ids, limit=limit, offset=offset)


@router.post("/", response_model=TrackingSessionResponse)
async def create_session(
    payload: TrackingSessionCreate,
    current_user: User = Depends(get_current_user),
    service: TrackingService = Depends(get_tracking_service),
):
    _ = payload
    return await service.create_session(current_user.id)


@router.get("/{session_id}/latest", response_model=TrackingPointResponse)
async def get_latest_point(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    senior_repo: SeniorRepository = Depends(get_senior_repo),
    service: TrackingService = Depends(get_tracking_service),
):
    session = await service.get_session(session_id)
    await ensure_session_read_access(current_user, session.user_id, access, senior_repo)
    return await service.get_latest_point(session_id)


@router.get("/{session_id}/points", response_model=ListPage[TrackingPointResponse])
async def list_points(
    session_id: UUID,
    limit: int = Query(..., ge=1, le=100),
    offset: int = Query(..., ge=0),
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    senior_repo: SeniorRepository = Depends(get_senior_repo),
    service: TrackingService = Depends(get_tracking_service),
):
    session = await service.get_session(session_id)
    await ensure_session_read_access(current_user, session.user_id, access, senior_repo)
    return await service.list_points(session_id, limit=limit, offset=offset)


@router.post("/{session_id}/points", response_model=TrackingPointResponse)
async def create_point(
    session_id: UUID,
    payload: TrackingPointCreate,
    current_user: User = Depends(get_current_user),
    service: TrackingService = Depends(get_tracking_service),
):
    session = await service.get_session(session_id)
    ensure_session_write_access(current_user, session.user_id)
    return await service.create_point(session_id, payload)


@router.get("/{session_id}", response_model=TrackingSessionResponse)
async def get_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    senior_repo: SeniorRepository = Depends(get_senior_repo),
    service: TrackingService = Depends(get_tracking_service),
):
    session = await service.get_session(session_id)
    await ensure_session_read_access(current_user, session.user_id, access, senior_repo)
    return await service.get_session_response(session_id)
