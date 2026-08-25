from typing import Optional
from uuid import UUID

from pydantic import UUID4, BaseModel, ConfigDict


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
    status: Optional[str] = None


class CareManagerCreate(BaseModel):
    user_id: UUID4
    employee_id: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    skills: Optional[str] = None
    status: Optional[str] = None


class CareManagerUpdate(BaseModel):
    employee_id: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    skills: Optional[str] = None
    status: Optional[str] = None
