from datetime import datetime
from typing import Optional

from pydantic import UUID4, BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    entity_name: Optional[str] = None
    entity_id: Optional[str] = None
    action: Optional[str] = None
    changes: Optional[str] = None
    created_at: Optional[datetime] = None
