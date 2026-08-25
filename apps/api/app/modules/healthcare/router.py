from datetime import date as date_type
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.schemas import ListPage
from app.modules.access.repository import AccessRepository
from app.modules.access.service import AccessService
from app.modules.healthcare.repository import HealthcareRepository
from app.modules.healthcare.schemas import (
    HealthDocumentResponse,
    HealthcareProviderResponse,
    LabResultResponse,
    MedicalRecordResponse,
    MedicationResponse,
    MedicationScheduleResponse,
)
from app.modules.healthcare.service import HealthcareService
from app.modules.seniors.repository import SeniorRepository
from app.modules.users.models import User

router = APIRouter()


def get_healthcare_service(db: AsyncSession = Depends(get_db)):
    return HealthcareService(HealthcareRepository(db))


def get_access_service(db: AsyncSession = Depends(get_db)):
    return AccessService(AccessRepository(db), SeniorRepository(db))


@router.get("/medications", response_model=ListPage[MedicationResponse])
async def list_medications(
    senior_id: Optional[UUID] = None,
    today: bool = False,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: HealthcareService = Depends(get_healthcare_service),
):
    scoped_senior_id = await access.resolve_senior_id(
        current_user, senior_id, allow_unscoped_staff=True
    )
    return await service.list_medications(
        senior_id=scoped_senior_id,
        today_only=today,
        limit=limit,
        offset=offset,
    )


@router.get("/medication-schedules", response_model=ListPage[MedicationScheduleResponse])
async def list_medication_schedules(
    senior_id: Optional[UUID] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: HealthcareService = Depends(get_healthcare_service),
):
    scoped_senior_id = await access.resolve_senior_id(
        current_user, senior_id, allow_unscoped_staff=True
    )
    return await service.list_medication_schedules(
        senior_id=scoped_senior_id,
        limit=limit,
        offset=offset,
    )


@router.get("/medical-records", response_model=ListPage[MedicalRecordResponse])
async def list_medical_records(
    senior_id: Optional[UUID] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: HealthcareService = Depends(get_healthcare_service),
):
    scoped_senior_id = await access.resolve_senior_id(
        current_user, senior_id, allow_unscoped_staff=True
    )
    return await service.list_medical_records(
        senior_id=scoped_senior_id,
        limit=limit,
        offset=offset,
    )


@router.get("/lab-results", response_model=ListPage[LabResultResponse])
async def list_lab_results(
    senior_id: Optional[UUID] = None,
    on_date: Optional[date_type] = Query(None, alias="date"),
    test_name: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: HealthcareService = Depends(get_healthcare_service),
):
    scoped_senior_id = await access.resolve_senior_id(
        current_user, senior_id, allow_unscoped_staff=True
    )
    return await service.list_lab_results(
        senior_id=scoped_senior_id,
        on_date=on_date,
        test_name=test_name,
        limit=limit,
        offset=offset,
    )


@router.get("/documents", response_model=ListPage[HealthDocumentResponse])
async def list_health_documents(
    senior_id: Optional[UUID] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: HealthcareService = Depends(get_healthcare_service),
):
    scoped_senior_id = await access.resolve_senior_id(
        current_user, senior_id, allow_unscoped_staff=True
    )
    return await service.list_health_documents(
        senior_id=scoped_senior_id,
        limit=limit,
        offset=offset,
    )


@router.get("/providers", response_model=ListPage[HealthcareProviderResponse])
async def list_providers(
    senior_id: Optional[UUID] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: HealthcareService = Depends(get_healthcare_service),
):
    scoped_senior_id = await access.resolve_senior_id(
        current_user, senior_id, allow_unscoped_staff=True
    )
    return await service.list_providers(
        senior_id=scoped_senior_id,
        limit=limit,
        offset=offset,
    )
