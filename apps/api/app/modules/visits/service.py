from datetime import date
from typing import Optional
from uuid import UUID
import json

from fastapi import HTTPException, status

from app.api.schemas import ListPage
from app.modules.audit.repository import AuditRepository
from app.modules.care.models import CareManager
from app.modules.care.repository import CareManagerRepository
from app.modules.care.schemas import care_manager_display_name
from app.modules.seniors.repository import SeniorRepository
from app.modules.visits.models import Visit, VisitStatus
from app.modules.visits.repository import VisitRepository
from app.modules.visits.schemas import VisitCreate, VisitReportResponse, VisitResponse, VisitTaskResponse, VisitUpdate


def to_visit_response(visit: Visit, care_manager: Optional[CareManager]) -> VisitResponse:
    return VisitResponse(
        id=visit.id,
        senior_id=visit.senior_id,
        care_manager_id=visit.care_manager_id,
        employee_id=care_manager.employee_id if care_manager else None,
        care_manager_name=(
            care_manager_display_name(care_manager.first_name, care_manager.last_name) if care_manager else None
        ),
        status=visit.status,
        scheduled_at=visit.scheduled_at,
        notes=visit.notes,
    )


class VisitService:
    def __init__(
        self,
        repo: VisitRepository,
        senior_repo: Optional[SeniorRepository] = None,
        care_repo: Optional[CareManagerRepository] = None,
        audit_repo: Optional[AuditRepository] = None,
    ):
        self.repo = repo
        self.senior_repo = senior_repo
        self.care_repo = care_repo
        self.audit_repo = audit_repo

    async def list_visits(
        self,
        *,
        senior_id: Optional[UUID] = None,
        care_manager_id: Optional[UUID] = None,
        status: Optional[VisitStatus] = None,
        on_date: Optional[date] = None,
        upcoming: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> ListPage[VisitResponse]:
        rows, total = await self.repo.list_visits(
            senior_id=senior_id,
            care_manager_id=care_manager_id,
            status=status,
            on_date=on_date,
            upcoming=upcoming,
            limit=limit,
            offset=offset,
        )
        return ListPage(
            items=[to_visit_response(visit, care_manager) for visit, care_manager in rows],
            total=total,
            limit=limit,
            offset=offset,
        )

    async def get_visit(self, visit_id: UUID) -> tuple[Visit, VisitResponse]:
        row = await self.repo.get_by_id(visit_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visit not found")
        visit, care_manager = row
        return visit, to_visit_response(visit, care_manager)

    async def list_tasks(self, visit_id: UUID) -> list[VisitTaskResponse]:
        rows = await self.repo.list_tasks(visit_id)
        return [VisitTaskResponse.model_validate(row) for row in rows]

    async def list_reports(self, visit_id: UUID) -> list[VisitReportResponse]:
        rows = await self.repo.list_reports(visit_id)
        return [VisitReportResponse.model_validate(row) for row in rows]

    async def _load_care_manager(self, care_manager_id: Optional[UUID]) -> Optional[CareManager]:
        if not care_manager_id or not self.care_repo:
            return None
        row = await self.care_repo.get_by_id(care_manager_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Care manager not found")
        return row

    async def create_visit(self, payload: VisitCreate) -> VisitResponse:
        if not self.senior_repo:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Senior repository missing")
        senior = await self.senior_repo.get_by_id(payload.senior_id)
        if not senior:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Senior not found")
        care_manager = await self._load_care_manager(payload.care_manager_id)
        visit = await self.repo.create(
            senior_id=payload.senior_id,
            care_manager_id=payload.care_manager_id,
            status=payload.status or VisitStatus.SCHEDULED,
            scheduled_at=payload.scheduled_at,
            notes=payload.notes,
        )
        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="visits",
                entity_id=str(visit.id),
                action="CREATE",
                changes=json.dumps({"senior_id": str(payload.senior_id), "care_manager_id": str(payload.care_manager_id) if payload.care_manager_id else None}),
            )
            await self.repo.session.commit()
        return to_visit_response(visit, care_manager)

    async def update_visit(self, visit_id: UUID, payload: VisitUpdate) -> VisitResponse:
        row = await self.repo.get_by_id(visit_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visit not found")
        visit, _existing_cm = row
        data = payload.model_dump(exclude_unset=True)
        if "care_manager_id" in data and data["care_manager_id"] is not None:
            await self._load_care_manager(data["care_manager_id"])
        visit = await self.repo.update(visit, data)
        care_manager = None
        if visit.care_manager_id and self.care_repo:
            care_manager = await self.care_repo.get_by_id(visit.care_manager_id)
        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="visits",
                entity_id=str(visit.id),
                action="UPDATE",
                changes=json.dumps({k: str(v) if v is not None else None for k, v in data.items()}),
            )
            await self.repo.session.commit()
        return to_visit_response(visit, care_manager)
