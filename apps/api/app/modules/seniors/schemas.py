from pydantic import BaseModel, UUID4
from typing import Optional
from datetime import datetime, date

class SeniorBase(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: date
    address: str
    emergency_contact: str

class SeniorCreate(SeniorBase):
    user_id: UUID4

class SeniorResponse(SeniorBase):
    id: UUID4
    user_id: UUID4
    class Config:
        from_attributes = True


class SeniorDirectoryItem(SeniorResponse):
    email: Optional[str] = None
