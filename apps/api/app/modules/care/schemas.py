from typing import Optional
from uuid import UUID

from pydantic import UUID4, BaseModel, ConfigDict, Field, field_validator


def care_manager_display_name(first_name: Optional[str], last_name: Optional[str]) -> Optional[str]:
    parts = [part.strip() for part in (first_name, last_name) if part and part.strip()]
    return " ".join(parts) if parts else None


class CareManagerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    user_id: Optional[UUID4] = None
    employee_id: Optional[str] = None
    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    skills: Optional[str] = None
    experience: Optional[str] = None
    languages: Optional[str] = None
    availability: Optional[str] = None
    status: Optional[str] = None
    staff_kind: Optional[str] = None


class CareManagerCreate(BaseModel):
    user_id: UUID4
    employee_id: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    skills: Optional[str] = None
    experience: Optional[str] = None
    languages: Optional[str] = None
    availability: Optional[str] = None
    status: Optional[str] = None
    staff_kind: Optional[str] = None


class CareManagerUpdate(BaseModel):
    employee_id: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    skills: Optional[str] = None
    experience: Optional[str] = None
    languages: Optional[str] = None
    availability: Optional[str] = None
    status: Optional[str] = None
    staff_kind: Optional[str] = None


class CareManagerApproval(BaseModel):
    employee_id: Optional[str] = None
    status: str = "ACTIVE"


class StaffProvisionRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    phone: str = Field(min_length=8, max_length=20)
    password: str = Field(min_length=8, max_length=128)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    employee_id: str = Field(min_length=1, max_length=50)
    staff_kind: str = Field(min_length=1, max_length=40)
    skills: Optional[str] = Field(default=None, max_length=500)
    experience: Optional[str] = Field(default=None, max_length=500)
    languages: Optional[str] = Field(default=None, max_length=200)
    availability: Optional[str] = Field(default=None, max_length=200)
    status: Optional[str] = Field(default="ACTIVE", max_length=40)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        email = value.strip().lower()
        if "@" not in email or "." not in email.split("@")[-1]:
            raise ValueError("Invalid email address")
        return email

    @field_validator("staff_kind")
    @classmethod
    def normalize_staff_kind(cls, value: str) -> str:
        kind = value.strip().upper()
        if kind not in ("CARE_MANAGER", "COMPANION", "DELIVERY_EXECUTIVE"):
            raise ValueError("staff_kind must be CARE_MANAGER, COMPANION, or DELIVERY_EXECUTIVE")
        return kind


class AssignedCareManager(BaseModel):
    id: UUID4
    user_id: Optional[UUID4] = None
    employee_id: Optional[str] = None
    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    skills: Optional[str] = None
    experience: Optional[str] = None
    languages: Optional[str] = None
    availability: Optional[str] = None
    status: Optional[str] = None
    staff_kind: Optional[str] = None


class AssignedCareManagerResponse(BaseModel):
    assigned: bool
    in_service_area: bool = False
    senior_id: Optional[UUID4] = None
    care_manager: Optional[AssignedCareManager] = None


class CareActivityResponse(BaseModel):
    id: UUID4
    senior_id: UUID4
    care_manager_id: Optional[UUID4] = None
    care_manager_name: Optional[str] = None
    activity_type: str
    status: str
    icon: str
    title: str
    occurred_at: Optional[str] = None
    scheduled_at: Optional[str] = None
    reason: Optional[str] = None
    discussion: Optional[str] = None
    action_taken: Optional[str] = None
    services_coordinated: Optional[str] = None
    follow_up_required: bool = False
    follow_up_date: Optional[str] = None
    follow_up_notes: Optional[str] = None
    notes: Optional[str] = None
    visit_id: Optional[UUID4] = None
    created_at: Optional[str] = None


class CareCallCreate(BaseModel):
    senior_id: Optional[UUID4] = None


class CareMessageCreate(BaseModel):
    senior_id: Optional[UUID4] = None


class CareVisitCreate(BaseModel):
    scheduled_at: str
    reason: Optional[str] = None
    senior_id: Optional[UUID4] = None


class CareActivityUpdate(BaseModel):
    activity_type: Optional[str] = None
    status: Optional[str] = None
    reason: Optional[str] = None
    discussion: Optional[str] = None
    action_taken: Optional[str] = None
    services_coordinated: Optional[str] = None
    follow_up_required: Optional[bool] = None
    follow_up_date: Optional[str] = None
    follow_up_notes: Optional[str] = None
    notes: Optional[str] = None
    occurred_at: Optional[str] = None
    scheduled_at: Optional[str] = None


class CareVisitSlot(BaseModel):
    start_at: str
    label: str


class CareVisitSlotsResponse(BaseModel):
    date: str
    slots: list[CareVisitSlot]
