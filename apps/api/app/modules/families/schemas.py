from datetime import date, datetime
from typing import Optional

from pydantic import UUID4, BaseModel, ConfigDict


class FamilyMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    user_id: UUID4
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    relationship: Optional[str] = None
    requested_senior_reference: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    preferred_language: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class FamilyMemberCreate(BaseModel):
    user_id: UUID4
    first_name: str
    last_name: str
    relationship: Optional[str] = None
    requested_senior_reference: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    preferred_language: Optional[str] = None


class FamilyMemberUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    relationship: Optional[str] = None
    requested_senior_reference: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    preferred_language: Optional[str] = None
