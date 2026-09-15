from datetime import datetime
from typing import Optional

from pydantic import UUID4, BaseModel, ConfigDict

from app.modules.deliveries.models import DeliveryStatus


class DeliveryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    care_manager_id: UUID4
    senior_id: Optional[UUID4] = None
    service_request_id: Optional[UUID4] = None
    title: str
    customer_name: Optional[str] = None
    location: Optional[str] = None
    status: DeliveryStatus
    scheduled_at: Optional[datetime] = None


class MemberDeliveryResponse(DeliveryResponse):
    executive_name: Optional[str] = None


class DeliveryStatusUpdate(BaseModel):
    status: DeliveryStatus
