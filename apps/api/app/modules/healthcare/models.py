from sqlalchemy import Column, String, DateTime, ForeignKey, UUID
import uuid
from app.db.base import Base

class HealthcareProvider(Base):
    __tablename__ = "healthcare_providers"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String)
    specialty = Column(String)

class MedicalRecord(Base):
    __tablename__ = "medical_records"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    senior_id = Column(UUID(as_uuid=True), ForeignKey("seniors.id"))
    provider_id = Column(UUID(as_uuid=True), ForeignKey("healthcare_providers.id"))
    notes = Column(String)


class Medication(Base):
    __tablename__ = "medications"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    senior_id = Column(UUID(as_uuid=True), ForeignKey("seniors.id"))
    name = Column(String)
    dosage = Column(String)

class MedicationSchedule(Base):
    __tablename__ = "medication_schedules"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    medication_id = Column(UUID(as_uuid=True), ForeignKey("medications.id"))
    schedule_time = Column(String)
    frequency = Column(String)

class HealthDocument(Base):
    __tablename__ = "health_documents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    senior_id = Column(UUID(as_uuid=True), ForeignKey("seniors.id"))
    file_url = Column(String)
    document_type = Column(String)

class LabResult(Base):
    __tablename__ = "lab_results"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    senior_id = Column(UUID(as_uuid=True), ForeignKey("seniors.id"))
    test_name = Column(String)
    result_value = Column(String)
    date = Column(DateTime)
