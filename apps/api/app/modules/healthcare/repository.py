from datetime import date
from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.appointments.models import Appointment
from app.modules.healthcare.models import (
    HealthDocument,
    HealthcareProvider,
    LabResult,
    MedicalRecord,
    Medication,
    MedicationSchedule,
)


class HealthcareRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_medications(
        self,
        *,
        senior_id: Optional[UUID] = None,
        today_only: bool = False,
        limit: int = 50,
        offset: int = 0,
    ):
        stmt = (
            select(Medication, MedicationSchedule)
            .outerjoin(MedicationSchedule, MedicationSchedule.medication_id == Medication.id)
        )
        count_stmt = select(func.count()).select_from(Medication)

        if senior_id is not None:
            stmt = stmt.where(Medication.senior_id == senior_id)
            count_stmt = count_stmt.where(Medication.senior_id == senior_id)
        if today_only:
            # Existing schedule model has no weekday column. "Today" means the
            # medication has at least one schedule row (typically frequency Daily).
            stmt = stmt.where(MedicationSchedule.id.is_not(None))
            count_stmt = count_stmt.where(
                Medication.id.in_(select(MedicationSchedule.medication_id))
            )

        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(
            stmt.order_by(Medication.name.asc()).offset(offset).limit(limit)
        )
        return result.all(), int(total)

    async def list_medication_schedules(
        self,
        *,
        senior_id: Optional[UUID] = None,
        limit: int = 50,
        offset: int = 0,
    ):
        stmt = (
            select(MedicationSchedule, Medication)
            .join(Medication, MedicationSchedule.medication_id == Medication.id)
        )
        count_stmt = (
            select(func.count())
            .select_from(MedicationSchedule)
            .join(Medication, MedicationSchedule.medication_id == Medication.id)
        )

        if senior_id is not None:
            stmt = stmt.where(Medication.senior_id == senior_id)
            count_stmt = count_stmt.where(Medication.senior_id == senior_id)

        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(
            stmt.order_by(Medication.name.asc(), MedicationSchedule.schedule_time.asc().nulls_last())
            .offset(offset)
            .limit(limit)
        )
        return result.all(), int(total)

    async def list_medical_records(
        self,
        *,
        senior_id: Optional[UUID] = None,
        limit: int = 50,
        offset: int = 0,
    ):
        stmt = select(MedicalRecord, HealthcareProvider.name).outerjoin(
            HealthcareProvider, MedicalRecord.provider_id == HealthcareProvider.id
        )
        count_stmt = select(func.count()).select_from(MedicalRecord)

        if senior_id is not None:
            stmt = stmt.where(MedicalRecord.senior_id == senior_id)
            count_stmt = count_stmt.where(MedicalRecord.senior_id == senior_id)

        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(
            stmt.order_by(MedicalRecord.id.asc()).offset(offset).limit(limit)
        )
        return result.all(), int(total)

    async def list_lab_results(
        self,
        *,
        senior_id: Optional[UUID] = None,
        on_date: Optional[date] = None,
        test_name: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ):
        stmt = select(LabResult)
        count_stmt = select(func.count()).select_from(LabResult)

        if senior_id is not None:
            stmt = stmt.where(LabResult.senior_id == senior_id)
            count_stmt = count_stmt.where(LabResult.senior_id == senior_id)
        if on_date is not None:
            day_filter = func.date(LabResult.date) == on_date
            stmt = stmt.where(day_filter)
            count_stmt = count_stmt.where(day_filter)
        if test_name:
            stmt = stmt.where(LabResult.test_name == test_name)
            count_stmt = count_stmt.where(LabResult.test_name == test_name)

        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(
            stmt.order_by(LabResult.date.desc().nulls_last()).offset(offset).limit(limit)
        )
        return result.scalars().all(), int(total)

    async def list_health_documents(
        self,
        *,
        senior_id: Optional[UUID] = None,
        limit: int = 50,
        offset: int = 0,
    ):
        stmt = select(HealthDocument)
        count_stmt = select(func.count()).select_from(HealthDocument)

        if senior_id is not None:
            stmt = stmt.where(HealthDocument.senior_id == senior_id)
            count_stmt = count_stmt.where(HealthDocument.senior_id == senior_id)

        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(
            stmt.order_by(HealthDocument.document_type.asc().nulls_last()).offset(offset).limit(limit)
        )
        return result.scalars().all(), int(total)

    def _provider_ids_for_senior(self, senior_id: Optional[UUID]):
        appointment_ids = select(Appointment.doctor_id).where(Appointment.doctor_id.is_not(None))
        record_ids = select(MedicalRecord.provider_id).where(MedicalRecord.provider_id.is_not(None))
        if senior_id is not None:
            appointment_ids = appointment_ids.where(Appointment.senior_id == senior_id)
            record_ids = record_ids.where(MedicalRecord.senior_id == senior_id)
        return appointment_ids.union(record_ids)

    async def list_providers(
        self,
        *,
        senior_id: Optional[UUID] = None,
        limit: int = 50,
        offset: int = 0,
    ):
        provider_ids = self._provider_ids_for_senior(senior_id)
        stmt = select(HealthcareProvider).where(HealthcareProvider.id.in_(provider_ids))
        count_stmt = select(func.count()).select_from(HealthcareProvider).where(
            HealthcareProvider.id.in_(provider_ids)
        )

        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(
            stmt.order_by(HealthcareProvider.name.asc().nulls_last()).offset(offset).limit(limit)
        )
        return result.scalars().all(), int(total)
