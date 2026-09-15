from datetime import date, datetime
from typing import Literal, Optional

from pydantic import UUID4, BaseModel, ConfigDict, Field

from app.modules.emergency.models import EmergencyStatus, EmergencyType, TRIGGER_APP_SOS

FirstResponseDispatch = Literal["SENT", "NO_CONTACT", "FAILED"]


class EmergencyRecipientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    role: str
    label: str
    status: str
    notified_at: Optional[datetime] = None
    responded_at: Optional[datetime] = None


class FirstResponseStatus(BaseModel):
    """Proveable first-response notify result (in-app notification rows). Not Expo delivery."""

    family: FirstResponseDispatch
    companion: FirstResponseDispatch


class EmergencyCaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    senior_id: UUID4
    senior_name: Optional[str] = None
    type: EmergencyType
    status: EmergencyStatus
    created_at: Optional[datetime] = None
    case_number: Optional[str] = None
    trigger_source: Optional[str] = None
    location_text: Optional[str] = None
    triggered_at: Optional[datetime] = None
    alert_sent_at: Optional[datetime] = None
    assistance_started_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    handled_by_name: Optional[str] = None
    emergency_reason: Optional[str] = None
    what_happened: Optional[str] = None
    action_taken: Optional[str] = None
    hospital_required: Optional[bool] = None
    hospital_details: Optional[str] = None
    family_communication: Optional[str] = None
    notes: Optional[str] = None
    follow_up_required: Optional[bool] = None
    follow_up_date: Optional[date] = None
    recipients: list[EmergencyRecipientResponse] = Field(default_factory=list)
    first_response: Optional[FirstResponseStatus] = None


class EmergencyEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    case_id: UUID4
    event_description: Optional[str] = None
    created_at: Optional[datetime] = None


class EmergencyCreate(BaseModel):
    type: EmergencyType
    senior_id: Optional[UUID4] = None
    trigger_source: str = TRIGGER_APP_SOS


class EmergencyStatusUpdate(BaseModel):
    status: EmergencyStatus


class EmergencyReportUpdate(BaseModel):
    emergency_reason: Optional[str] = None
    what_happened: Optional[str] = None
    action_taken: Optional[str] = None
    hospital_required: Optional[bool] = None
    hospital_details: Optional[str] = None
    family_communication: Optional[str] = None
    notes: Optional[str] = None
    follow_up_required: Optional[bool] = None
    follow_up_date: Optional[date] = None
    mark_resolved: bool = False
    mark_closed: bool = False
