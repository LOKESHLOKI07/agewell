from pydantic import BaseModel, UUID4
from typing import Optional, List
from datetime import datetime

class DocumentsResponse(BaseModel):
    id: UUID4
    class Config:
        from_attributes = True

class DocumentsCreate(BaseModel):
    pass
