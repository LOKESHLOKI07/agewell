from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status

from app.api.schemas import ListPage
from app.modules.access.service import AccessService
from app.modules.tracking.models import LocationPoint, LocationSession
from app.modules.tracking.repository import TrackingRepository
from app.modules.tracking.schemas import (
    CareAssociateLatestLocationResponse,
    CareAssociateTrackingPointResponse,
    CareAssociateTrackingSessionResponse,
    TrackingPointCreate,
    TrackingPointResponse,
    TrackingSessionResponse,
)
from app.modules.visits.repository import VisitRepository

UNAVAILABLE = "Care associate tracking is unavailable"
NOT_ASSIGNED = "Care manager is not assigned to this visit"


def to_session_response(row: LocationSession) -> TrackingSessionResponse:
    return TrackingSessionResponse.model_validate(row)


def to_point_response(row: LocationPoint) -> TrackingPointResponse:
    return TrackingPointResponse.model_validate(row)


def to_care_session_response(row: LocationSession) -> CareAssociateTrackingSessionResponse:
    return CareAssociateTrackingSessionResponse.model_validate(row)


def to_care_point_response(row: LocationPoint) -> CareAssociateTrackingPointResponse:
    return CareAssociateTrackingPointResponse.model_validate(row)


def to_care_latest_response(row: LocationPoint) -> CareAssociateLatestLocationResponse:
    return CareAssociateLatestLocationResponse.model_validate(row)


class TrackingService:
    def __init__(self, repo: TrackingRepository, visit_repo: Optional[VisitRepository] = None):
        self.repo = repo
        self.visit_repo = visit_repo

    async def create_session(self, user_id: UUID) -> TrackingSessionResponse:
        row = await self.repo.create_session(user_id=user_id)
        await self.repo.session.commit()
        await self.repo.session.refresh(row)
        return to_session_response(row)

    async def get_session(self, session_id: UUID) -> LocationSession:
        row = await self.repo.get_session(session_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tracking session not found")
        return row

    async def get_session_response(self, session_id: UUID) -> TrackingSessionResponse:
        return to_session_response(await self.get_session(session_id))

    async def list_sessions(
        self,
        *,
        user_ids: Optional[list[UUID]],
        limit: int,
        offset: int,
    ) -> ListPage[TrackingSessionResponse]:
        if user_ids is not None and len(user_ids) == 0:
            return ListPage(items=[], total=0, limit=limit, offset=offset)
        rows, total = await self.repo.list_sessions(user_ids=user_ids, limit=limit, offset=offset)
        return ListPage(
            items=[to_session_response(row) for row in rows],
            total=total,
            limit=limit,
            offset=offset,
        )

    async def create_point(self, session_id: UUID, payload: TrackingPointCreate) -> TrackingPointResponse:
        await self.get_session(session_id)
        timestamp = payload.timestamp
        if timestamp.tzinfo is not None:
            timestamp = timestamp.replace(tzinfo=None)
        row = await self.repo.create_point(
            session_id=session_id,
            latitude=payload.latitude,
            longitude=payload.longitude,
            timestamp=timestamp,
        )
        await self.repo.session.commit()
        await self.repo.session.refresh(row)
        return to_point_response(row)

    async def get_latest_point(self, session_id: UUID) -> TrackingPointResponse:
        await self.get_session(session_id)
        row = await self.repo.get_latest_point(session_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location point not found")
        return to_point_response(row)

    async def list_points(
        self,
        session_id: UUID,
        *,
        limit: int,
        offset: int,
    ) -> ListPage[TrackingPointResponse]:
        await self.get_session(session_id)
        rows, total = await self.repo.list_points(session_id, limit=limit, offset=offset)
        return ListPage(
            items=[to_point_response(row) for row in rows],
            total=total,
            limit=limit,
            offset=offset,
        )

    async def get_or_create_session_for_user(self, user_id: UUID) -> CareAssociateTrackingSessionResponse:
        existing = await self.repo.get_newest_session_for_user(user_id)
        if existing:
            return to_care_session_response(existing)
        row = await self.repo.create_session(user_id=user_id)
        await self.repo.session.commit()
        await self.repo.session.refresh(row)
        return to_care_session_response(row)

    async def create_care_associate_point(
        self, session_id: UUID, payload: TrackingPointCreate
    ) -> CareAssociateTrackingPointResponse:
        point = await self.create_point(session_id, payload)
        return CareAssociateTrackingPointResponse.model_validate(point.model_dump())

    async def resolve_visit_care_associate_session(
        self,
        visit_id: UUID,
        user,
        access: AccessService,
    ) -> LocationSession:
        if self.visit_repo is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Visit repository is required")
        row = await self.visit_repo.get_by_id(visit_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visit not found")
        visit, care_manager = row
        await access.ensure_visit_access(user, visit)
        if not visit.care_manager_id or care_manager is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=NOT_ASSIGNED)
        if care_manager.user_id is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=UNAVAILABLE)
        session = await self.repo.get_newest_session_for_user(care_manager.user_id)
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=UNAVAILABLE)
        return session

    async def get_visit_care_associate_session(
        self, visit_id: UUID, user, access: AccessService
    ) -> CareAssociateTrackingSessionResponse:
        session = await self.resolve_visit_care_associate_session(visit_id, user, access)
        return to_care_session_response(session)

    async def get_visit_care_associate_latest(
        self, visit_id: UUID, user, access: AccessService
    ) -> CareAssociateLatestLocationResponse:
        session = await self.resolve_visit_care_associate_session(visit_id, user, access)
        row = await self.repo.get_latest_point(session.id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location point not found")
        return to_care_latest_response(row)

    async def list_visit_care_associate_points(
        self,
        visit_id: UUID,
        user,
        access: AccessService,
        *,
        limit: int,
        offset: int,
    ) -> ListPage[CareAssociateTrackingPointResponse]:
        session = await self.resolve_visit_care_associate_session(visit_id, user, access)
        rows, total = await self.repo.list_points(session.id, limit=limit, offset=offset)
        return ListPage(
            items=[to_care_point_response(row) for row in rows],
            total=total,
            limit=limit,
            offset=offset,
        )
