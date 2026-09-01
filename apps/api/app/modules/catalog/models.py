import uuid

from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, UUID

from app.db.base import Base


class GroceryCategory(Base):
    __tablename__ = "grocery_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)


class GroceryProduct(Base):
    __tablename__ = "grocery_products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id = Column(UUID(as_uuid=True), ForeignKey("grocery_categories.id"), nullable=False)
    name = Column(String, nullable=False)
    unit = Column(String, nullable=False, default="")
    price_label = Column(String, nullable=False, default="")
    image = Column(Text, nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)


class FoodCuisine(Base):
    __tablename__ = "food_cuisines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(String, nullable=False, default="")
    sort_order = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)


class FoodMenuItem(Base):
    __tablename__ = "food_menu_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cuisine_id = Column(UUID(as_uuid=True), ForeignKey("food_cuisines.id"), nullable=False)
    meal = Column(String, nullable=False)
    name = Column(String, nullable=False)
    price_label = Column(String, nullable=False, default="")
    image = Column(Text, nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)


class ServiceOffering(Base):
    """Shared catalogue items for membership services (pooja, doctors, events, …)."""

    __tablename__ = "service_offerings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_slug = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False, default="")
    badge = Column(String, nullable=False, default="")
    price_label = Column(String, nullable=False, default="")
    image = Column(Text, nullable=True)
    meta_json = Column(Text, nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
