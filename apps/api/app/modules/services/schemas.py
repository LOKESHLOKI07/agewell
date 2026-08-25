from typing import Optional

from pydantic import UUID4, BaseModel, ConfigDict

from app.modules.services.models import ServiceCategory, ServiceRequestStatus

class ServiceBase(BaseModel):
    name: str
    category: ServiceCategory
    description: str

class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[ServiceCategory] = None
    description: Optional[str] = None

class ServiceResponse(ServiceBase):
    id: UUID4
    class Config:
        from_attributes = True

class ServiceRequestCreate(BaseModel):
    senior_id: UUID4
    service_id: UUID4

class ServiceRequestResponse(ServiceRequestCreate):
    id: UUID4
    status: ServiceRequestStatus
    class Config:
        from_attributes = True


class ServiceRequestRead(BaseModel):
    id: UUID4
    senior_id: UUID4
    service_id: UUID4
    service_name: str
    status: ServiceRequestStatus

    class Config:
        from_attributes = True


class ServiceRequestStatusUpdate(BaseModel):
    status: ServiceRequestStatus
