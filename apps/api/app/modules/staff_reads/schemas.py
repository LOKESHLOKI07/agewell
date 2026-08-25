from datetime import datetime
from typing import Optional

from pydantic import UUID4, BaseModel, ConfigDict


class OrderListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID4
    user_id: Optional[UUID4] = None
    status: Optional[str] = None
    total_amount: Optional[float] = None


class PaymentListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID4
    order_id: Optional[UUID4] = None
    status: Optional[str] = None
    amount: Optional[float] = None


class AddonItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID4
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None


class DocumentItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID4
    owner_id: Optional[UUID4] = None
    filename: Optional[str] = None
    content_type: Optional[str] = None
    created_at: Optional[datetime] = None
