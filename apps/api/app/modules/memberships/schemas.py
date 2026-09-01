from datetime import datetime
from enum import Enum
from typing import List, Literal, Optional

from pydantic import UUID4, BaseModel, ConfigDict, Field


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
    plan_key: Literal["basic", "couple"]
    senior_id: Optional[UUID4] = None
    notes: Optional[str] = Field(default=None, max_length=2000)


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
    created_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None

