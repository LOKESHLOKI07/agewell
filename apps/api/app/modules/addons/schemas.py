from pydantic import BaseModel, UUID4
from typing import Optional, List
from datetime import datetime

class AddonsResponse(BaseModel):
    id: UUID4
    class Config:
        from_attributes = True

class AddonsCreate(BaseModel):
    pass
