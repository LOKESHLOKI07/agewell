from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator


class FamilyInviteCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(default="", max_length=100)
    relationship: str = Field(min_length=1, max_length=100)
    email: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=20)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        email = value.strip().lower()
        if not email:
            return None
        if "@" not in email or "." not in email.split("@")[-1]:
            raise ValueError("Invalid email address")
        return email

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        digits = "".join(ch for ch in value if ch.isdigit())
        return digits or None

    @field_validator("first_name", "last_name", "relationship")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return (value or "").strip()

    @model_validator(mode="after")
    def require_phone(self):
        # Mobile is required: it is the initial login password for the family account.
        if not self.phone or len(self.phone) < 8:
            raise ValueError("A mobile number is required (it becomes their login password)")
        return self


class FamilyInviteResponse(BaseModel):
    id: UUID
    senior_id: UUID
    first_name: str
    last_name: str
    relationship: str
    email: Optional[str] = None
    phone: Optional[str] = None
    status: str
    expires_at: datetime
    created_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    access_id: Optional[UUID] = None
    debug_code: Optional[str] = None
    """Shown to the senior once so they can share login details."""
    initial_password: Optional[str] = None
    account_created: bool = False
    already_linked: bool = False

    model_config = {"from_attributes": True}


class FamilyCircleMember(BaseModel):
    access_id: UUID
    family_id: UUID
    first_name: str
    last_name: str
    relationship: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    linked_at: Optional[datetime] = None


class FamilyCircleResponse(BaseModel):
    invites: list[FamilyInviteResponse]
    members: list[FamilyCircleMember]


class FamilyInviteOtpRequest(BaseModel):
    email: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=20)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        email = value.strip().lower()
        if not email:
            return None
        if "@" not in email or "." not in email.split("@")[-1]:
            raise ValueError("Invalid email address")
        return email

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        digits = "".join(ch for ch in value if ch.isdigit())
        return digits or None

    @model_validator(mode="after")
    def require_one(self):
        if not self.email and not self.phone:
            raise ValueError("Enter the email or mobile from your invite")
        if self.email and self.phone:
            raise ValueError("Use either email or mobile, not both")
        return self


class FamilyInviteOtpVerifyRequest(FamilyInviteOtpRequest):
    code: str = Field(min_length=6, max_length=6)


class FamilyInviteOtpSentResponse(BaseModel):
    message: str
    channel: str
    contact: str
    debug_code: Optional[str] = None


class FamilyInviteClaimTokenResponse(BaseModel):
    claim_token: str
    first_name: str
    last_name: str
    relationship: str
    email: Optional[str] = None
    phone: Optional[str] = None


class FamilyInviteCompleteRequest(BaseModel):
    claim_token: str = Field(min_length=16, max_length=4096)
    password: str = Field(min_length=8, max_length=128)
    first_name: Optional[str] = Field(default=None, max_length=100)
    last_name: Optional[str] = Field(default=None, max_length=100)
    email: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=20)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        email = value.strip().lower()
        if not email:
            return None
        if "@" not in email or "." not in email.split("@")[-1]:
            raise ValueError("Invalid email address")
        return email

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        digits = "".join(ch for ch in value if ch.isdigit())
        return digits or None
