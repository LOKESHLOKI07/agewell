import json
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status

from app.api.schemas import ListPage
from app.modules.audit.repository import AuditRepository
from app.modules.community.models import CommunityEvent, EventRegistration
from app.modules.community.repository import CommunityRepository
from app.modules.community.schemas import (
    CommunityEventCreate,
    CommunityEventResponse,
    CommunityEventUpdate,
    EventRegistrationResponse,
    EventRegistrationUpdate,
    RegistrationStatus,
)


def to_event_response(event: CommunityEvent) -> CommunityEventResponse:
    return CommunityEventResponse.model_validate(event)


def to_registration_response(row: EventRegistration, event_title: Optional[str]) -> EventRegistrationResponse:
    return EventRegistrationResponse(
        id=row.id,
        event_id=row.event_id,
        user_id=row.user_id,
        status=row.status,
        event_title=event_title,
    )


class CommunityService:
    def __init__(self, repo: CommunityRepository, audit_repo: Optional[AuditRepository] = None):
        self.repo = repo
        self.audit_repo = audit_repo

    async def list_events(self, *, limit: int = 50, offset: int = 0) -> ListPage[CommunityEventResponse]:
        rows, total = await self.repo.list_events(limit=limit, offset=offset)
        return ListPage(
            items=[to_event_response(event) for event in rows],
            total=total,
            limit=limit,
            offset=offset,
        )

    async def get_event(self, event_id: UUID) -> CommunityEvent:
        event = await self.repo.get_event_by_id(event_id)
        if not event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
        return event

    async def get_event_response(self, event_id: UUID) -> CommunityEventResponse:
        return to_event_response(await self.get_event(event_id))

    async def create_event(self, payload: CommunityEventCreate) -> CommunityEventResponse:
        event = await self.repo.create_event(
            title=payload.title,
            description=payload.description,
            event_date=payload.event_date,
            capacity=payload.capacity,
        )
        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="community_events",
                entity_id=str(event.id),
                action="CREATE",
                changes=json.dumps({
                    "title": payload.title,
                    "description": payload.description,
                    "event_date": payload.event_date.isoformat(),
                    "capacity": payload.capacity,
                }),
            )
        await self.repo.session.commit()
        await self.repo.session.refresh(event)
        return to_event_response(event)

    async def update_event(self, event_id: UUID, payload: CommunityEventUpdate) -> CommunityEventResponse:
        event = await self.get_event(event_id)
        data = payload.model_dump(exclude_unset=True)
        event = await self.repo.update_event(event, data)
        if self.audit_repo:
            changes = {
                key: (value.isoformat() if hasattr(value, "isoformat") else value)
                for key, value in data.items()
            }
            await self.audit_repo.record(
                entity_name="community_events",
                entity_id=str(event.id),
                action="UPDATE",
                changes=json.dumps(changes),
            )
        await self.repo.session.commit()
        await self.repo.session.refresh(event)
        return to_event_response(event)

    async def delete_event(self, event_id: UUID) -> CommunityEventResponse:
        event = await self.get_event(event_id)
        response = to_event_response(event)
        payload = {
            "title": event.title,
            "description": event.description,
            "capacity": event.capacity,
        }
        await self.repo.delete_event(event)
        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="community_events",
                entity_id=str(event_id),
                action="DELETE",
                changes=json.dumps(payload),
            )
        await self.repo.session.commit()
        return response

    async def register(self, event_id: UUID, user_id: UUID) -> EventRegistrationResponse:
        event = await self.repo.lock_event_by_id(event_id)
        if not event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

        existing = await self.repo.get_registration_for_event_user(event_id, user_id)
        if existing and existing.status == RegistrationStatus.REGISTERED.value:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Registration already exists")

        active = await self.repo.count_active_registrations(event_id)
        if event.capacity is not None and active >= event.capacity:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Event is at capacity")

        if existing:
            row = await self.repo.update_registration(
                existing, {"status": RegistrationStatus.REGISTERED.value}
            )
        else:
            row = await self.repo.create_registration(
                event_id=event_id,
                user_id=user_id,
                status=RegistrationStatus.REGISTERED.value,
            )
        await self.repo.session.commit()
        return to_registration_response(row, event.title)

    async def list_registrations(
        self,
        *,
        user_ids: Optional[list[UUID]],
        limit: int = 50,
        offset: int = 0,
    ) -> ListPage[EventRegistrationResponse]:
        if user_ids is not None and len(user_ids) == 0:
            return ListPage(items=[], total=0, limit=limit, offset=offset)
        rows, total = await self.repo.list_registrations(user_ids=user_ids, limit=limit, offset=offset)
        return ListPage(
            items=[to_registration_response(row, title) for row, title in rows],
            total=total,
            limit=limit,
            offset=offset,
        )

    async def get_registration(self, registration_id: UUID) -> tuple[EventRegistration, EventRegistrationResponse]:
        row = await self.repo.get_registration(registration_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found")
        registration, event_title = row
        return registration, to_registration_response(registration, event_title)

    async def update_registration(
        self, registration: EventRegistration, payload: EventRegistrationUpdate
    ) -> EventRegistrationResponse:
        if payload.status != RegistrationStatus.CANCELLED:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid registration status")
        row = await self.repo.update_registration(
            registration, {"status": RegistrationStatus.CANCELLED.value}
        )
        await self.repo.session.commit()
        refreshed = await self.repo.get_registration(row.id)
        registration, event_title = refreshed
        return to_registration_response(registration, event_title)
