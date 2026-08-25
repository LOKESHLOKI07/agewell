from datetime import date
from typing import Optional

from pydantic import UUID4, BaseModel, ConfigDict


class SeniorBase(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: date
    address: str
    emergency_contact: str


class SeniorCreate(SeniorBase):
    user_id: UUID4


class SeniorUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class SeniorResponse(SeniorBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    user_id: UUID4


class SeniorDirectoryItem(SeniorResponse):
    email: Optional[str] = None
    phone: Optional[str] = None
    account_status: Optional[str] = None
