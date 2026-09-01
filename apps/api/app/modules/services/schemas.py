from typing import Optional

from pydantic import UUID4, BaseModel, field_validator

from app.modules.catalog.schemas import normalize_catalog_image
from app.modules.services.models import ServiceCategory, ServiceRequestStatus


class ServiceBase(BaseModel):
    name: str
    category: ServiceCategory
    description: str
    slug: Optional[str] = None
    cover_image: Optional[str] = None

    @field_validator("cover_image")
    @classmethod
    def validate_cover_image(cls, value: Optional[str]) -> Optional[str]:
        return normalize_catalog_image(value)


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[ServiceCategory] = None
    description: Optional[str] = None
    slug: Optional[str] = None
    cover_image: Optional[str] = None

    @field_validator("cover_image")
    @classmethod
    def validate_cover_image(cls, value: Optional[str]) -> Optional[str]:
        return normalize_catalog_image(value)


class ServiceResponse(ServiceBase):
    id: UUID4

    class Config:
        from_attributes = True


class ServiceRequestCreate(BaseModel):
    senior_id: UUID4
    service_id: UUID4
    notes: Optional[str] = None


class ServiceRequestResponse(BaseModel):
    id: UUID4
    senior_id: UUID4
    service_id: UUID4
    status: ServiceRequestStatus
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class ServiceRequestRead(BaseModel):
    id: UUID4
    senior_id: UUID4
    service_id: UUID4
    service_name: str
    service_slug: Optional[str] = None
    status: ServiceRequestStatus
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class ServiceRequestStatusUpdate(BaseModel):
    status: ServiceRequestStatus
