from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import UUID4, BaseModel, field_validator, model_validator

from app.modules.catalog.schemas import normalize_catalog_image
from app.modules.services.models import ServiceCategory, ServiceRequestStatus


class ServiceBase(BaseModel):
    name: str
    category: ServiceCategory
    description: str
    slug: Optional[str] = None
    cover_image: Optional[str] = None
    call_hours_text: Optional[str] = None
    support_phone: Optional[str] = None

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
    call_hours_text: Optional[str] = None
    support_phone: Optional[str] = None

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
    list_photo: Optional[str] = None


class ServiceRequestResponse(BaseModel):
    id: UUID4
    senior_id: UUID4
    service_id: UUID4
    status: ServiceRequestStatus
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ServiceRequestRead(BaseModel):
    id: UUID4
    senior_id: UUID4
    service_id: UUID4
    service_name: str
    service_slug: Optional[str] = None
    senior_name: Optional[str] = None
    status: ServiceRequestStatus
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    proof_photo: Optional[str] = None
    list_photo: Optional[str] = None
    dispatcher_id: Optional[UUID4] = None
    executor_id: Optional[UUID4] = None
    dispatch_mode: Optional[str] = None
    awaiting_dispatch: bool = False

    class Config:
        from_attributes = True


class ServiceRequestStatusUpdate(BaseModel):
    status: ServiceRequestStatus
    proof_photo: Optional[str] = None


class ServiceRequestAssign(BaseModel):
    care_manager_id: Optional[UUID4] = None
    care_manager_ids: Optional[list[UUID4]] = None

    @model_validator(mode="after")
    def require_assignees(self):
        if not self.resolved_ids():
            raise ValueError("Provide care_manager_id or care_manager_ids.")
        return self

    def resolved_ids(self) -> list[UUID]:
        if self.care_manager_ids:
            return list(dict.fromkeys(self.care_manager_ids))
        if self.care_manager_id is not None:
            return [self.care_manager_id]
        return []


class ServiceRequestAssignServiceCompanion(BaseModel):
    care_manager_id: UUID4
