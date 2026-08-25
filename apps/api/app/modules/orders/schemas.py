from pydantic import BaseModel, UUID4
from typing import Optional, List
from datetime import datetime

class OrdersResponse(BaseModel):
    id: UUID4
    class Config:
        from_attributes = True

class OrdersCreate(BaseModel):
    pass
