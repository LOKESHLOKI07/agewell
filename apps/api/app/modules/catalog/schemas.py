from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

FoodMeal = Literal["Breakfast", "Lunch", "Dinner"]
FOOD_MEALS = ("Breakfast", "Lunch", "Dinner")

ALLOWED_IMAGE_PREFIXES = (
    "data:image/jpeg;base64,",
    "data:image/jpg;base64,",
    "data:image/png;base64,",
    "data:image/webp;base64,",
)
MAX_IMAGE_CHARS = 700_000


def normalize_catalog_image(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    image = value.strip()
    if not image:
        return None
    lowered = image.lower()
    if not any(lowered.startswith(prefix) for prefix in ALLOWED_IMAGE_PREFIXES):
        raise ValueError("Image must be a JPEG, PNG, or WebP data URL.")
    if len(image) > MAX_IMAGE_CHARS:
        raise ValueError("That image is too large. Choose a smaller image.")
    return image


def normalize_food_meal(value: str) -> FoodMeal:
    meal = value.strip()
    if meal not in FOOD_MEALS:
        raise ValueError("Meal must be Breakfast, Lunch, or Dinner.")
    return meal  # type: ignore[return-value]


class GroceryCategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    sort_order: int = 0
    is_active: bool = True


class GroceryCategoryUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class GroceryCategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    sort_order: int
    is_active: bool


class GroceryProductCreate(BaseModel):
    category_id: UUID
    name: str = Field(min_length=1, max_length=200)
    unit: str = Field(default="", max_length=80)
    price_label: str = Field(default="", max_length=80)
    image: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True


class GroceryProductUpdate(BaseModel):
    category_id: Optional[UUID] = None
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    unit: Optional[str] = Field(default=None, max_length=80)
    price_label: Optional[str] = Field(default=None, max_length=80)
    image: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class GroceryProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    category_id: UUID
    name: str
    unit: str
    price_label: str
    image: Optional[str] = None
    sort_order: int
    is_active: bool


class GroceryCatalogResponse(BaseModel):
    categories: list[GroceryCategoryResponse]
    products: list[GroceryProductResponse]


class FoodCuisineCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=500)
    sort_order: int = 0
    is_active: bool = True


class FoodCuisineUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, max_length=500)
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class FoodCuisineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str
    sort_order: int
    is_active: bool


class FoodMenuItemCreate(BaseModel):
    cuisine_id: UUID
    meal: FoodMeal
    name: str = Field(min_length=1, max_length=200)
    price_label: str = Field(default="", max_length=80)
    image: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True


class FoodMenuItemUpdate(BaseModel):
    cuisine_id: Optional[UUID] = None
    meal: Optional[FoodMeal] = None
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    price_label: Optional[str] = Field(default=None, max_length=80)
    image: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class FoodMenuItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    cuisine_id: UUID
    meal: FoodMeal
    name: str
    price_label: str
    image: Optional[str] = None
    sort_order: int
    is_active: bool


class FoodCatalogResponse(BaseModel):
    cuisines: list[FoodCuisineResponse]
    items: list[FoodMenuItemResponse]


# Slugs that use the shared offerings catalogue (grocery/food keep dedicated tables).
OFFERING_SERVICE_SLUGS = (
    "emergency-sos",
    "care-manager",
    "companion",
    "medicine",
    "lab-testing",
    "monthly-blood-test",
    "doctor",
    "medical-history",
    "tech-assistance",
    "events-trips",
    "legal",
    "ca",
    "transport",
    "home-repair",
    "pooja",
    "home-inspection",
    "cctv",
)


class ServiceOfferingCreate(BaseModel):
    service_slug: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)
    badge: str = Field(default="", max_length=120)
    price_label: str = Field(default="", max_length=80)
    image: Optional[str] = None
    meta_json: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True


class ServiceOfferingUpdate(BaseModel):
    service_slug: Optional[str] = Field(default=None, min_length=1, max_length=80)
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    badge: Optional[str] = Field(default=None, max_length=120)
    price_label: Optional[str] = Field(default=None, max_length=80)
    image: Optional[str] = None
    meta_json: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class ServiceOfferingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    service_slug: str
    title: str
    description: str
    badge: str
    price_label: str
    image: Optional[str] = None
    meta_json: Optional[str] = None
    sort_order: int
    is_active: bool


class ServiceOfferingsResponse(BaseModel):
    items: list[ServiceOfferingResponse]

