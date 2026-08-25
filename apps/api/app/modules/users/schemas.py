from datetime import datetime
from typing import Optional

from pydantic import UUID4, BaseModel, ConfigDict, EmailStr

from .models import RoleEnum


class UserBase(BaseModel):
    email: str
    phone: str
    role: RoleEnum


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[RoleEnum] = None


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
