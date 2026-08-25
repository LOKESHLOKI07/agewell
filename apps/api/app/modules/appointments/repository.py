from datetime import date
from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.timezone import scheduled_on_app_date
from app.modules.appointments.models import Appointment, AppointmentStatus
from app.modules.healthcare.models import HealthcareProvider


class AppointmentRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, appointment_id: UUID) -> Optional[tuple[Appointment, Optional[str]]]:
        stmt = (
            select(Appointment, HealthcareProvider.name)
            .outerjoin(HealthcareProvider, Appointment.doctor_id == HealthcareProvider.id)
            .where(Appointment.id == appointment_id)
        )
        result = await self.session.execute(stmt)
        row = result.first()
        return (row[0], row[1]) if row else None

    async def get_provider_by_id(self, provider_id: UUID) -> Optional[HealthcareProvider]:
        result = await self.session.execute(
            select(HealthcareProvider).where(HealthcareProvider.id == provider_id)
        )
        return result.scalars().first()

    async def create(self, **kwargs) -> Appointment:
        appointment = Appointment(**kwargs)
        self.session.add(appointment)
        await self.session.commit()
        await self.session.refresh(appointment)
        return appointment

    async def update(self, appointment: Appointment, data: dict) -> Appointment:
        for field, value in data.items():
            setattr(appointment, field, value)
        await self.session.commit()
        await self.session.refresh(appointment)
        return appointment

    async def list_appointments(
        self,
        *,
        senior_id: Optional[UUID] = None,
        status: Optional[AppointmentStatus] = None,
        on_date: Optional[date] = None,
        upcoming: bool = False,
        limit: int = 50,
        offset: int = 0,
    ):
        stmt = select(Appointment, HealthcareProvider.name).outerjoin(
            HealthcareProvider, Appointment.doctor_id == HealthcareProvider.id
        )
        count_stmt = select(func.count()).select_from(Appointment)

        if senior_id is not None:
            stmt = stmt.where(Appointment.senior_id == senior_id)
            count_stmt = count_stmt.where(Appointment.senior_id == senior_id)
        if status is not None:
            stmt = stmt.where(Appointment.status == status)
            count_stmt = count_stmt.where(Appointment.status == status)
        if on_date is not None:
            day_filter = scheduled_on_app_date(Appointment.scheduled_at, on_date)
            stmt = stmt.where(day_filter)
            count_stmt = count_stmt.where(day_filter)
        if upcoming:
            upcoming_filter = Appointment.scheduled_at >= func.now()
            stmt = stmt.where(upcoming_filter)
            count_stmt = count_stmt.where(upcoming_filter)

        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(
            stmt.order_by(Appointment.scheduled_at.asc().nulls_last()).offset(offset).limit(limit)
        )
        return result.all(), int(total)
