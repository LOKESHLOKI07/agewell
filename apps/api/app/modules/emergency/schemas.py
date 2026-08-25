from datetime import datetime
from typing import Optional

from pydantic import UUID4, BaseModel, ConfigDict

from app.modules.emergency.models import EmergencyStatus, EmergencyType


class EmergencyCaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    senior_id: UUID4
    type: EmergencyType
    status: EmergencyStatus
    created_at: Optional[datetime] = None


class EmergencyEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    case_id: UUID4
    event_description: Optional[str] = None
    created_at: Optional[datetime] = None


class EmergencyCreate(BaseModel):
    type: EmergencyType
    senior_id: Optional[UUID4] = None


class EmergencyStatusUpdate(BaseModel):
    status: EmergencyStatus
