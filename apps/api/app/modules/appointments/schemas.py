from datetime import datetime
from typing import Optional

from pydantic import UUID4, BaseModel, ConfigDict

from app.modules.appointments.models import AppointmentStatus


class AppointmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    senior_id: UUID4
    doctor_id: Optional[UUID4] = None
    doctor_name: Optional[str] = None
    status: AppointmentStatus
    scheduled_at: Optional[datetime] = None


class AppointmentCreate(BaseModel):
    senior_id: Optional[UUID4] = None
    doctor_id: UUID4
    scheduled_at: datetime
    status: Optional[AppointmentStatus] = None


class AppointmentUpdate(BaseModel):
    status: Optional[AppointmentStatus] = None
    scheduled_at: Optional[datetime] = None
    doctor_id: Optional[UUID4] = None
