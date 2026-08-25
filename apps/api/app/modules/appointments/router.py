from datetime import date as date_type
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.schemas import ListPage
from app.core.timezone import today_in_app_timezone
from app.modules.access.repository import AccessRepository
from app.modules.access.service import FORBIDDEN, AccessService
from app.modules.appointments.models import Appointment, AppointmentStatus
from app.modules.appointments.repository import AppointmentRepository
from app.modules.appointments.schemas import AppointmentCreate, AppointmentResponse, AppointmentUpdate
from app.modules.appointments.service import AppointmentService
from app.modules.audit.repository import AuditRepository
from app.modules.seniors.repository import SeniorRepository
from app.modules.users.models import RoleEnum, User

router = APIRouter()


def get_appointment_service(db: AsyncSession = Depends(get_db)):
    return AppointmentService(
        AppointmentRepository(db),
        SeniorRepository(db),
        AuditRepository(db),
    )


def get_access_service(db: AsyncSession = Depends(get_db)):
    return AccessService(AccessRepository(db), SeniorRepository(db))


async def authorize_appointment(user: User, appointment: Appointment, access: AccessService) -> None:
    if appointment.senior_id is None:
        if user.role not in (RoleEnum.ADMIN, RoleEnum.OPERATIONS):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
        return
    await access.resolve_senior_id(user, appointment.senior_id)


@router.get("/", response_model=ListPage[AppointmentResponse])
async def list_appointments(
    senior_id: Optional[UUID] = None,
    status: Optional[AppointmentStatus] = None,
    on_date: Optional[date_type] = Query(None, alias="date"),
    upcoming: bool = False,
    today: bool = False,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: AppointmentService = Depends(get_appointment_service),
):
    scoped_senior_id = await access.resolve_senior_id(
        current_user, senior_id, allow_unscoped_staff=True
    )
    resolved_date = today_in_app_timezone() if today else on_date
    return await service.list_appointments(
        senior_id=scoped_senior_id,
        status=status,
        on_date=resolved_date,
        upcoming=upcoming,
        limit=limit,
        offset=offset,
    )


@router.post("/", response_model=AppointmentResponse)
async def create_appointment(
    payload: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: AppointmentService = Depends(get_appointment_service),
):
    scoped_senior_id = await access.resolve_senior_id(current_user, payload.senior_id)
    if scoped_senior_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="senior_id is required")
    return await service.create_appointment(payload, scoped_senior_id)


@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: UUID,
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: AppointmentService = Depends(get_appointment_service),
):
    appointment, payload = await service.get_appointment(appointment_id)
    await authorize_appointment(current_user, appointment, access)
    return payload


@router.patch("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: UUID,
    payload: AppointmentUpdate,
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: AppointmentService = Depends(get_appointment_service),
):
    appointment, _existing = await service.get_appointment(appointment_id)
    await authorize_appointment(current_user, appointment, access)
    return await service.update_appointment(appointment, payload)
