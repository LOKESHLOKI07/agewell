from datetime import datetime
from typing import Optional

from pydantic import UUID4, BaseModel, ConfigDict


class AttendanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    care_manager_id: UUID4
    check_in_at: datetime
    check_out_at: Optional[datetime] = None
    location: Optional[str] = None
    status: str


class AttendanceCheckIn(BaseModel):
    location: Optional[str] = None


class AttendanceCheckOut(BaseModel):
    location: Optional[str] = None
