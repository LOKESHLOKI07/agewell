from datetime import datetime
from typing import Optional

from pydantic import UUID4, BaseModel, ConfigDict


class FamilySeniorAccessCreate(BaseModel):
    family_id: UUID4
    senior_id: UUID4


class FamilySeniorAccessResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    family_id: UUID4
    senior_id: UUID4
    created_at: Optional[datetime] = None
