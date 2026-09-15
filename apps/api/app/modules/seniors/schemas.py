from datetime import date
from typing import Optional

from pydantic import UUID4, BaseModel, ConfigDict, Field

ALLOWED_PHOTO_PREFIXES = (
    "data:image/jpeg;base64,",
    "data:image/jpg;base64,",
    "data:image/png;base64,",
    "data:image/webp;base64,",
)
MAX_PHOTO_CHARS = 700_000


def normalize_profile_photo(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    photo = value.strip()
    if not photo:
        return None
    lowered = photo.lower()
    if not any(lowered.startswith(prefix) for prefix in ALLOWED_PHOTO_PREFIXES):
        raise ValueError("Photo must be a JPEG, PNG, or WebP image.")
    if len(photo) > MAX_PHOTO_CHARS:
        raise ValueError("That photo is too large. Choose a smaller image.")
    return photo


class SeniorBase(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: date
    address: str
    emergency_contact: str
    preferred_language: Optional[str] = None
    family_contact_1_name: Optional[str] = None
    family_contact_1_phone: Optional[str] = None
    family_contact_2_name: Optional[str] = None
    family_contact_2_phone: Optional[str] = None
    preferred_hospital: Optional[str] = None


class SeniorCreate(SeniorBase):
    user_id: UUID4
    in_service_area: Optional[bool] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    location_query: Optional[str] = None
    location_source: Optional[str] = None


class SeniorUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    preferred_language: Optional[str] = None
    family_contact_1_name: Optional[str] = None
    family_contact_1_phone: Optional[str] = None
    family_contact_2_name: Optional[str] = None
    family_contact_2_phone: Optional[str] = None
    preferred_hospital: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    photo: Optional[str] = None
    in_service_area: Optional[bool] = None
    care_manager_id: Optional[UUID4] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    location_query: Optional[str] = None
    location_source: Optional[str] = None


class SeniorPhotoUpdate(BaseModel):
    photo: Optional[str] = None
    in_service_area: Optional[bool] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    location_query: Optional[str] = None
    location_source: Optional[str] = None


class SeniorResponse(SeniorBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    user_id: UUID4
    photo: Optional[str] = None
    in_service_area: bool = False
    care_manager_id: Optional[UUID4] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    location_query: Optional[str] = None
    location_source: Optional[str] = None


class SeniorDirectoryItem(SeniorResponse):
    email: Optional[str] = None
    phone: Optional[str] = None
    account_status: Optional[str] = None
    photo: Optional[str] = Field(default=None, exclude=True)
    has_membership: bool = False
