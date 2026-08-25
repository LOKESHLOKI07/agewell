from datetime import datetime
from typing import List, Optional

from pydantic import UUID4, BaseModel, ConfigDict


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

