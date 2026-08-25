from datetime import datetime
from typing import Optional

from pydantic import UUID4, BaseModel, ConfigDict

from .models import AccountStatus, RoleEnum


class UserBase(BaseModel):
    email: str
    phone: str
    role: RoleEnum


class UserCreate(UserBase):
    password: str
    account_status: Optional[AccountStatus] = None


class UserUpdate(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[RoleEnum] = None
    account_status: Optional[AccountStatus] = None


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    account_status: AccountStatus = AccountStatus.ACTIVE
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
