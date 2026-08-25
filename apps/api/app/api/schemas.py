from typing import Generic, List, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ListPage(BaseModel, Generic[T]):
    items: List[T]
    total: int
    limit: int = Field(..., ge=0)
    offset: int = Field(..., ge=0)
