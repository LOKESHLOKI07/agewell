from datetime import datetime
from typing import Optional

from pydantic import UUID4, BaseModel, ConfigDict, field_validator


def _as_coordinate(value, *, name: str, minimum: float, maximum: float) -> str:
    try:
        number = float(value)
    except (TypeError, ValueError):
        raise ValueError(f"{name} must be a number") from None
    if number < minimum or number > maximum:
        raise ValueError(f"{name} must be between {minimum} and {maximum}")
    if isinstance(value, str) and value.strip():
        return value.strip()
    return format(number, ".10f").rstrip("0").rstrip(".") or "0"


class TrackingSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    user_id: Optional[UUID4] = None


class TrackingSessionCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")


class TrackingPointResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    session_id: UUID4
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    timestamp: Optional[datetime] = None


class TrackingPointCreate(BaseModel):
    latitude: str
    longitude: str
    timestamp: datetime

    @field_validator("latitude", mode="before")
    @classmethod
    def validate_latitude(cls, value):
        return _as_coordinate(value, name="latitude", minimum=-90, maximum=90)

    @field_validator("longitude", mode="before")
    @classmethod
    def validate_longitude(cls, value):
        return _as_coordinate(value, name="longitude", minimum=-180, maximum=180)


class CareAssociateTrackingSessionCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")


class CareAssociateTrackingSessionResponse(TrackingSessionResponse):
    pass


class CareAssociateTrackingPointCreate(TrackingPointCreate):
    pass


class CareAssociateTrackingPointResponse(TrackingPointResponse):
    pass


class CareAssociateLatestLocationResponse(TrackingPointResponse):
    pass
