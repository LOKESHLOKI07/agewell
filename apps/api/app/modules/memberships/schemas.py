from datetime import datetime
from enum import Enum
from typing import List, Literal, Optional

from pydantic import UUID4, BaseModel, ConfigDict, Field, field_validator, model_validator


class MembershipBenefitItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    benefit_id: UUID4
    benefit_name: str
    quota: Optional[int] = None


class CurrentMembershipResponse(BaseModel):
    membership_id: UUID4
    plan_id: UUID4
    plan_name: str
    status: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    benefits: List[MembershipBenefitItem]


class MembershipUsageItem(BaseModel):
    benefit_id: UUID4
    benefit_name: str
    quota: Optional[int] = None
    used: int
    remaining: Optional[int] = None


class MembershipPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    name: Optional[str] = None
    price: Optional[float] = None


class MembershipBenefitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    plan_id: Optional[UUID4] = None
    benefit_name: Optional[str] = None
    quota: Optional[int] = None


class MembershipRecordResponse(BaseModel):
    id: UUID4
    senior_id: Optional[UUID4] = None
    plan_id: Optional[UUID4] = None
    plan_name: Optional[str] = None
    status: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class MembershipRequestStatus(str, Enum):
    REQUESTED = "REQUESTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class MembershipRequestCreate(BaseModel):
    plan_key: Literal["single", "couple", "basic"]
    senior_id: Optional[UUID4] = None
    notes: Optional[str] = Field(default=None, max_length=2000)
    family_contact_1_name: str = Field(min_length=1, max_length=80)
    family_contact_1_phone: str = Field(min_length=8, max_length=20)
    family_contact_2_name: Optional[str] = Field(default=None, max_length=80)
    family_contact_2_phone: Optional[str] = Field(default=None, max_length=20)
    preferred_hospital: str = Field(min_length=1, max_length=200)

    @field_validator(
        "family_contact_1_name",
        "family_contact_1_phone",
        "preferred_hospital",
        "family_contact_2_name",
        "family_contact_2_phone",
        "notes",
        mode="before",
    )
    @classmethod
    def strip_text(cls, value):
        if isinstance(value, str):
            stripped = value.strip()
            return stripped or None
        return value

    @model_validator(mode="after")
    def family_two_needs_name_and_phone(self):
        name = self.family_contact_2_name
        phone = self.family_contact_2_phone
        if bool(name) != bool(phone):
            raise ValueError("Family member 2 needs both a name and a phone number.")
        if phone and len(phone) < 8:
            raise ValueError("Family member 2 needs a valid phone number.")
        return self


class MembershipRequestReview(BaseModel):
    status: Literal["APPROVED", "REJECTED"]


class MembershipRequestResponse(BaseModel):
    id: UUID4
    senior_id: UUID4
    senior_name: Optional[str] = None
    plan_id: UUID4
    plan_name: str
    plan_price: Optional[float] = None
    status: str
    notes: Optional[str] = None
    family_contact_1_name: Optional[str] = None
    family_contact_1_phone: Optional[str] = None
    family_contact_2_name: Optional[str] = None
    family_contact_2_phone: Optional[str] = None
    preferred_hospital: Optional[str] = None
    created_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None

