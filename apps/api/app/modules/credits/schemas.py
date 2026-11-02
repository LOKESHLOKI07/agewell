from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional

from pydantic import UUID4, BaseModel, ConfigDict, Field, model_validator


class CreditAccountBalance(BaseModel):
    category: Literal["SERVICE", "EMERGENCY"]
    allocated_amount: float
    spent_amount: float
    available_balance: float


class CreditBalancesResponse(BaseModel):
    senior_id: UUID4
    service: CreditAccountBalance
    emergency: CreditAccountBalance
    total_spent_amount: float


class CreditTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    senior_id: UUID4
    category: str
    transaction_type: str
    amount: float
    status: str
    description: Optional[str] = None
    membership_id: Optional[UUID4] = None
    service_request_id: Optional[UUID4] = None
    emergency_case_id: Optional[UUID4] = None
    expense_id: Optional[UUID4] = None
    created_by_user_id: Optional[UUID4] = None
    approved_by_user_id: Optional[UUID4] = None
    created_at: Optional[datetime] = None


class ExpenseCreate(BaseModel):
    service_request_id: Optional[UUID4] = None
    emergency_case_id: Optional[UUID4] = None
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    description: Optional[str] = Field(default=None, max_length=500)
    receipt_document_id: Optional[UUID4] = None

    @model_validator(mode="after")
    def exactly_one_source(self):
        has_request = self.service_request_id is not None
        has_case = self.emergency_case_id is not None
        if has_request == has_case:
            raise ValueError("Provide either service_request_id or emergency_case_id.")
        return self


class ExpenseReject(BaseModel):
    reason: Optional[str] = Field(default=None, max_length=500)


class AdminExpenseCreate(BaseModel):
    senior_id: UUID4
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    description: str = Field(min_length=1, max_length=500)
    category: Literal["SERVICE", "EMERGENCY"] = "SERVICE"


class ExpenseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    senior_id: UUID4
    category: str
    amount: float
    description: Optional[str] = None
    status: str
    service_request_id: Optional[UUID4] = None
    emergency_case_id: Optional[UUID4] = None
    receipt_document_id: Optional[UUID4] = None
    submitted_by_user_id: UUID4
    reviewed_by_user_id: Optional[UUID4] = None
    reviewed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: Optional[datetime] = None
