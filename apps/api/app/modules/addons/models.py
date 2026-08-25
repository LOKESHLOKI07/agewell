from sqlalchemy import Column, String, DateTime, ForeignKey, UUID, Numeric, Enum
import uuid
import enum
from app.db.base import Base

class AddOnCategory(str, enum.Enum):
    CARE = "CARE"
    FOOD = "FOOD"
    DAILY_LIFE = "DAILY_LIFE"
    TRANSPORT = "TRANSPORT"
    HEALTHCARE = "HEALTHCARE"
    HOME = "HOME"

class AddOn(Base):
    __tablename__ = "addons"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String)
    category = Column(Enum(AddOnCategory))
    price = Column(Numeric(10, 2))
