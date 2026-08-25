import json
from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status

from app.api.schemas import ListPage
from app.modules.appointments.models import Appointment, AppointmentStatus
from app.modules.appointments.repository import AppointmentRepository
from app.modules.appointments.schemas import AppointmentCreate, AppointmentResponse, AppointmentUpdate
from app.modules.audit.repository import AuditRepository
from app.modules.seniors.repository import SeniorRepository


def to_appointment_response(appointment: Appointment, doctor_name: Optional[str]) -> AppointmentResponse:
    return AppointmentResponse(
        id=appointment.id,
        senior_id=appointment.senior_id,
        doctor_id=appointment.doctor_id,
        doctor_name=doctor_name,
        status=appointment.status,
        scheduled_at=appointment.scheduled_at,
    )


class AppointmentService:
    def __init__(
        self,
        repo: AppointmentRepository,
        senior_repo: Optional[SeniorRepository] = None,
        audit_repo: Optional[AuditRepository] = None,
    ):
        self.repo = repo
        self.senior_repo = senior_repo
        self.audit_repo = audit_repo

    async def list_appointments(
        self,
        *,
        senior_id: Optional[UUID] = None,
        status: Optional[AppointmentStatus] = None,
        on_date: Optional[date] = None,
        upcoming: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> ListPage[AppointmentResponse]:
        rows, total = await self.repo.list_appointments(
            senior_id=senior_id,
            status=status,
            on_date=on_date,
            upcoming=upcoming,
            limit=limit,
            offset=offset,
        )
        items = [
            to_appointment_response(appointment, doctor_name)
            for appointment, doctor_name in rows
        ]
        return ListPage(items=items, total=total, limit=limit, offset=offset)

    async def get_appointment(self, appointment_id: UUID) -> tuple[Appointment, AppointmentResponse]:
        row = await self.repo.get_by_id(appointment_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
        appointment, doctor_name = row
        return appointment, to_appointment_response(appointment, doctor_name)

    async def _require_provider(self, doctor_id: UUID):
        provider = await self.repo.get_provider_by_id(doctor_id)
        if not provider:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Healthcare provider not found")
        return provider

    async def _response_for(self, appointment: Appointment) -> AppointmentResponse:
        row = await self.repo.get_by_id(appointment.id)
        appointment, doctor_name = row
        return to_appointment_response(appointment, doctor_name)

    async def create_appointment(self, payload: AppointmentCreate, senior_id: UUID) -> AppointmentResponse:
        if not self.senior_repo:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Senior repository missing")
        senior = await self.senior_repo.get_by_id(senior_id)
        if not senior:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Senior not found")
        await self._require_provider(payload.doctor_id)
        appointment = await self.repo.create(
            senior_id=senior_id,
            doctor_id=payload.doctor_id,
            scheduled_at=payload.scheduled_at,
            status=payload.status or AppointmentStatus.REQUESTED,
        )
        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="appointments",
                entity_id=str(appointment.id),
                action="CREATE",
                changes=json.dumps({
                    "senior_id": str(senior_id),
                    "doctor_id": str(payload.doctor_id),
                    "status": (payload.status or AppointmentStatus.REQUESTED).value,
                }),
            )
            await self.repo.session.commit()
        return await self._response_for(appointment)

    async def update_appointment(self, appointment: Appointment, payload: AppointmentUpdate) -> AppointmentResponse:
        data = payload.model_dump(exclude_unset=True)
        if "doctor_id" in data and data["doctor_id"] is not None:
            await self._require_provider(data["doctor_id"])
        appointment = await self.repo.update(appointment, data)
        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="appointments",
                entity_id=str(appointment.id),
                action="UPDATE",
                changes=json.dumps({
                    k: (v.value if isinstance(v, AppointmentStatus) else str(v) if v is not None else None)
                    for k, v in data.items()
                }),
            )
            await self.repo.session.commit()
        return await self._response_for(appointment)
