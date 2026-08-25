from datetime import date as date_type
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_staff
from app.api.schemas import ListPage
from app.core.timezone import today_in_app_timezone
from app.modules.access.repository import AccessRepository
from app.modules.access.service import AccessService
from app.modules.audit.repository import AuditRepository
from app.modules.care.repository import CareManagerRepository
from app.modules.seniors.repository import SeniorRepository
from app.modules.users.models import RoleEnum, User
from app.modules.visits.models import VisitStatus
from app.modules.visits.repository import VisitRepository
from app.modules.visits.schemas import VisitCreate, VisitReportResponse, VisitResponse, VisitTaskResponse, VisitUpdate
from app.modules.visits.service import VisitService

router = APIRouter()


def get_visit_service(db: AsyncSession = Depends(get_db)):
    return VisitService(
        VisitRepository(db),
        SeniorRepository(db),
        CareManagerRepository(db),
        AuditRepository(db),
    )


def get_access_service(db: AsyncSession = Depends(get_db)):
    return AccessService(AccessRepository(db), SeniorRepository(db))


@router.get("/", response_model=ListPage[VisitResponse])
async def list_visits(
    senior_id: Optional[UUID] = None,
    care_manager_id: Optional[UUID] = None,
    status: Optional[VisitStatus] = None,
    on_date: Optional[date_type] = Query(None, alias="date"),
    upcoming: bool = False,
    today: bool = False,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: VisitService = Depends(get_visit_service),
):
    scope = await access.resolve_visit_list_scope(
        current_user, senior_id, allow_unscoped_staff=True
    )
    resolved_date = today_in_app_timezone() if today else on_date
    # Staff may additionally filter by care associate; non-staff keep scope.care_manager_id.
    effective_care_manager_id = scope.care_manager_id
    if current_user.role in (RoleEnum.ADMIN, RoleEnum.OPERATIONS) and care_manager_id is not None:
        effective_care_manager_id = care_manager_id
    return await service.list_visits(
        senior_id=scope.senior_id,
        care_manager_id=effective_care_manager_id,
        status=status,
        on_date=resolved_date,
        upcoming=upcoming,
        limit=limit,
        offset=offset,
    )


@router.post("/", response_model=VisitResponse)
async def create_visit(
    payload: VisitCreate,
    _staff: User = Depends(require_staff),
    service: VisitService = Depends(get_visit_service),
):
    return await service.create_visit(payload)


@router.get("/{visit_id}/tasks", response_model=list[VisitTaskResponse])
async def list_visit_tasks(
    visit_id: UUID,
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: VisitService = Depends(get_visit_service),
):
    visit, _payload = await service.get_visit(visit_id)
    await access.ensure_visit_access(current_user, visit)
    return await service.list_tasks(visit_id)


@router.get("/{visit_id}/reports", response_model=list[VisitReportResponse])
async def list_visit_reports(
    visit_id: UUID,
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: VisitService = Depends(get_visit_service),
):
    visit, _payload = await service.get_visit(visit_id)
    await access.ensure_visit_access(current_user, visit)
    return await service.list_reports(visit_id)


@router.get("/{visit_id}", response_model=VisitResponse)
async def get_visit(
    visit_id: UUID,
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: VisitService = Depends(get_visit_service),
):
    visit, payload = await service.get_visit(visit_id)
    await access.ensure_visit_access(current_user, visit)
    return payload


@router.patch("/{visit_id}", response_model=VisitResponse)
async def update_visit(
    visit_id: UUID,
    payload: VisitUpdate,
    _staff: User = Depends(require_staff),
    service: VisitService = Depends(get_visit_service),
):
    return await service.update_visit(visit_id, payload)
