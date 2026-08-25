from datetime import datetime
from typing import Optional

from pydantic import UUID4, BaseModel, ConfigDict


class MedicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    medication_id: UUID4
    name: str
    dosage: Optional[str] = None
    schedule: Optional[str] = None
    frequency: Optional[str] = None


class MedicationScheduleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    medication_id: UUID4
    medication_name: str
    dosage: Optional[str] = None
    schedule_time: Optional[str] = None
    frequency: Optional[str] = None


class MedicalRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    senior_id: UUID4
    provider_id: Optional[UUID4] = None
    provider_name: Optional[str] = None
    notes: Optional[str] = None


class LabResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    senior_id: UUID4
    test_name: Optional[str] = None
    result_value: Optional[str] = None
    date: Optional[datetime] = None


class HealthDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    senior_id: UUID4
    file_url: Optional[str] = None
    document_type: Optional[str] = None


class HealthcareProviderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    name: Optional[str] = None
    specialty: Optional[str] = None
