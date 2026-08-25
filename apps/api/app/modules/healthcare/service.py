from datetime import date
from typing import Optional
from uuid import UUID

from app.api.schemas import ListPage
from app.modules.healthcare.repository import HealthcareRepository
from app.modules.healthcare.schemas import (
    HealthDocumentResponse,
    HealthcareProviderResponse,
    LabResultResponse,
    MedicalRecordResponse,
    MedicationResponse,
    MedicationScheduleResponse,
)


class HealthcareService:
    def __init__(self, repo: HealthcareRepository):
        self.repo = repo

    async def list_medications(
        self,
        *,
        senior_id: Optional[UUID] = None,
        today_only: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> ListPage[MedicationResponse]:
        rows, total = await self.repo.list_medications(
            senior_id=senior_id,
            today_only=today_only,
            limit=limit,
            offset=offset,
        )
        items = [
            MedicationResponse(
                medication_id=medication.id,
                name=medication.name,
                dosage=medication.dosage,
                schedule=schedule.schedule_time if schedule is not None else None,
                frequency=schedule.frequency if schedule is not None else None,
            )
            for medication, schedule in rows
        ]
        return ListPage(items=items, total=total, limit=limit, offset=offset)

    async def list_medication_schedules(
        self,
        *,
        senior_id: Optional[UUID] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> ListPage[MedicationScheduleResponse]:
        rows, total = await self.repo.list_medication_schedules(
            senior_id=senior_id,
            limit=limit,
            offset=offset,
        )
        items = [
            MedicationScheduleResponse(
                id=schedule.id,
                medication_id=medication.id,
                medication_name=medication.name,
                dosage=medication.dosage,
                schedule_time=schedule.schedule_time,
                frequency=schedule.frequency,
            )
            for schedule, medication in rows
        ]
        return ListPage(items=items, total=total, limit=limit, offset=offset)

    async def list_medical_records(
        self,
        *,
        senior_id: Optional[UUID] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> ListPage[MedicalRecordResponse]:
        rows, total = await self.repo.list_medical_records(
            senior_id=senior_id,
            limit=limit,
            offset=offset,
        )
        items = [
            MedicalRecordResponse(
                id=record.id,
                senior_id=record.senior_id,
                provider_id=record.provider_id,
                provider_name=provider_name,
                notes=record.notes,
            )
            for record, provider_name in rows
        ]
        return ListPage(items=items, total=total, limit=limit, offset=offset)

    async def list_lab_results(
        self,
        *,
        senior_id: Optional[UUID] = None,
        on_date: Optional[date] = None,
        test_name: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> ListPage[LabResultResponse]:
        rows, total = await self.repo.list_lab_results(
            senior_id=senior_id,
            on_date=on_date,
            test_name=test_name,
            limit=limit,
            offset=offset,
        )
        items = [LabResultResponse.model_validate(row) for row in rows]
        return ListPage(items=items, total=total, limit=limit, offset=offset)

    async def list_health_documents(
        self,
        *,
        senior_id: Optional[UUID] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> ListPage[HealthDocumentResponse]:
        rows, total = await self.repo.list_health_documents(
            senior_id=senior_id,
            limit=limit,
            offset=offset,
        )
        items = [HealthDocumentResponse.model_validate(row) for row in rows]
        return ListPage(items=items, total=total, limit=limit, offset=offset)

    async def list_providers(
        self,
        *,
        senior_id: Optional[UUID] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> ListPage[HealthcareProviderResponse]:
        rows, total = await self.repo.list_providers(
            senior_id=senior_id,
            limit=limit,
            offset=offset,
        )
        items = [HealthcareProviderResponse.model_validate(row) for row in rows]
        return ListPage(items=items, total=total, limit=limit, offset=offset)
