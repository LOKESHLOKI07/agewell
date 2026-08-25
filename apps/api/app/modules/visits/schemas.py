from datetime import datetime
from typing import Optional

from pydantic import UUID4, BaseModel, ConfigDict

from app.modules.visits.models import VisitStatus


class VisitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    senior_id: UUID4
    care_manager_id: Optional[UUID4] = None
    employee_id: Optional[str] = None
    care_manager_name: Optional[str] = None
    status: VisitStatus
    scheduled_at: Optional[datetime] = None
    notes: Optional[str] = None


class VisitCreate(BaseModel):
    senior_id: UUID4
    care_manager_id: Optional[UUID4] = None
    status: Optional[VisitStatus] = None
    scheduled_at: Optional[datetime] = None
    notes: Optional[str] = None


class VisitUpdate(BaseModel):
    care_manager_id: Optional[UUID4] = None
    status: Optional[VisitStatus] = None
    scheduled_at: Optional[datetime] = None
    notes: Optional[str] = None


class VisitTaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    visit_id: UUID4
    task_name: Optional[str] = None
    is_completed: bool = False


class VisitReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    visit_id: UUID4
    summary: Optional[str] = None
    issues_noted: Optional[str] = None
