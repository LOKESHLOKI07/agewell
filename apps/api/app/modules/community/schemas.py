from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import UUID4, BaseModel, ConfigDict, Field


class RegistrationStatus(str, Enum):
    REGISTERED = "REGISTERED"
    CANCELLED = "CANCELLED"


class CommunityEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[datetime] = None
    capacity: Optional[int] = None


class CommunityEventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: datetime
    capacity: Optional[int] = Field(default=None, ge=0)


class CommunityEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[datetime] = None
    capacity: Optional[int] = Field(default=None, ge=0)


class EventRegistrationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    event_id: UUID4
    user_id: UUID4
    status: RegistrationStatus
    event_title: Optional[str] = None


class EventRegistrationCreate(BaseModel):
    senior_id: Optional[UUID4] = None


class EventRegistrationUpdate(BaseModel):
    status: RegistrationStatus
