from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_staff
from app.modules.catalog.repository import CatalogRepository
from app.modules.catalog.schemas import (
    FoodCatalogResponse,
    FoodCuisineCreate,
    FoodCuisineResponse,
    FoodCuisineUpdate,
    FoodMenuItemCreate,
    FoodMenuItemResponse,
    FoodMenuItemUpdate,
    GroceryCatalogResponse,
    GroceryCategoryCreate,
    GroceryCategoryResponse,
    GroceryCategoryUpdate,
    GroceryProductCreate,
    GroceryProductResponse,
    GroceryProductUpdate,
    ServiceOfferingCreate,
    ServiceOfferingResponse,
    ServiceOfferingsResponse,
    ServiceOfferingUpdate,
)
from app.modules.catalog.service import CatalogService
from app.modules.users.models import RoleEnum, User

router = APIRouter()

CATALOG_READ_ROLES = {
    RoleEnum.SENIOR,
    RoleEnum.FAMILY,
    RoleEnum.ADMIN,
    RoleEnum.OPERATIONS,
    RoleEnum.CARE_MANAGER,
}


def get_catalog_service(db: AsyncSession = Depends(get_db)) -> CatalogService:
    return CatalogService(CatalogRepository(db))


def ensure_catalog_reader(user: User) -> None:
    from fastapi import HTTPException, status
    from app.modules.access.service import FORBIDDEN

    if user.role not in CATALOG_READ_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)


@router.get("/grocery", response_model=GroceryCatalogResponse)
async def get_grocery_catalog(
    include_inactive: bool = Query(False),
    current_user: User = Depends(get_current_user),
    service: CatalogService = Depends(get_catalog_service),
):
    ensure_catalog_reader(current_user)
    staff = current_user.role in (RoleEnum.ADMIN, RoleEnum.OPERATIONS)
    active_only = not (include_inactive and staff)
    return await service.get_grocery_catalog(active_only=active_only)


@router.post("/grocery/categories", response_model=GroceryCategoryResponse)
async def create_grocery_category(
    payload: GroceryCategoryCreate,
    _staff: User = Depends(require_staff),
    service: CatalogService = Depends(get_catalog_service),
):
    return await service.create_grocery_category(payload)


@router.patch("/grocery/categories/{category_id}", response_model=GroceryCategoryResponse)
async def update_grocery_category(
    category_id: UUID,
    payload: GroceryCategoryUpdate,
    _staff: User = Depends(require_staff),
    service: CatalogService = Depends(get_catalog_service),
):
    return await service.update_grocery_category(category_id, payload)


@router.delete("/grocery/categories/{category_id}", status_code=204)
async def delete_grocery_category(
    category_id: UUID,
    _staff: User = Depends(require_staff),
    service: CatalogService = Depends(get_catalog_service),
):
    await service.delete_grocery_category(category_id)


@router.post("/grocery/products", response_model=GroceryProductResponse)
async def create_grocery_product(
    payload: GroceryProductCreate,
    _staff: User = Depends(require_staff),
    service: CatalogService = Depends(get_catalog_service),
):
    return await service.create_grocery_product(payload)


@router.patch("/grocery/products/{product_id}", response_model=GroceryProductResponse)
async def update_grocery_product(
    product_id: UUID,
    payload: GroceryProductUpdate,
    _staff: User = Depends(require_staff),
    service: CatalogService = Depends(get_catalog_service),
):
    return await service.update_grocery_product(product_id, payload)


@router.delete("/grocery/products/{product_id}", status_code=204)
async def delete_grocery_product(
    product_id: UUID,
    _staff: User = Depends(require_staff),
    service: CatalogService = Depends(get_catalog_service),
):
    await service.delete_grocery_product(product_id)


@router.get("/food", response_model=FoodCatalogResponse)
async def get_food_catalog(
    include_inactive: bool = Query(False),
    current_user: User = Depends(get_current_user),
    service: CatalogService = Depends(get_catalog_service),
):
    ensure_catalog_reader(current_user)
    staff = current_user.role in (RoleEnum.ADMIN, RoleEnum.OPERATIONS)
    active_only = not (include_inactive and staff)
    return await service.get_food_catalog(active_only=active_only)


@router.post("/food/cuisines", response_model=FoodCuisineResponse)
async def create_food_cuisine(
    payload: FoodCuisineCreate,
    _staff: User = Depends(require_staff),
    service: CatalogService = Depends(get_catalog_service),
):
    return await service.create_food_cuisine(payload)


@router.patch("/food/cuisines/{cuisine_id}", response_model=FoodCuisineResponse)
async def update_food_cuisine(
    cuisine_id: UUID,
    payload: FoodCuisineUpdate,
    _staff: User = Depends(require_staff),
    service: CatalogService = Depends(get_catalog_service),
):
    return await service.update_food_cuisine(cuisine_id, payload)


@router.delete("/food/cuisines/{cuisine_id}", status_code=204)
async def delete_food_cuisine(
    cuisine_id: UUID,
    _staff: User = Depends(require_staff),
    service: CatalogService = Depends(get_catalog_service),
):
    await service.delete_food_cuisine(cuisine_id)


@router.post("/food/items", response_model=FoodMenuItemResponse)
async def create_food_menu_item(
    payload: FoodMenuItemCreate,
    _staff: User = Depends(require_staff),
    service: CatalogService = Depends(get_catalog_service),
):
    return await service.create_food_menu_item(payload)


@router.patch("/food/items/{item_id}", response_model=FoodMenuItemResponse)
async def update_food_menu_item(
    item_id: UUID,
    payload: FoodMenuItemUpdate,
    _staff: User = Depends(require_staff),
    service: CatalogService = Depends(get_catalog_service),
):
    return await service.update_food_menu_item(item_id, payload)


@router.delete("/food/items/{item_id}", status_code=204)
async def delete_food_menu_item(
    item_id: UUID,
    _staff: User = Depends(require_staff),
    service: CatalogService = Depends(get_catalog_service),
):
    await service.delete_food_menu_item(item_id)


@router.get("/offerings", response_model=ServiceOfferingsResponse)
async def list_service_offerings(
    service_slug: str | None = Query(None),
    include_inactive: bool = Query(False),
    current_user: User = Depends(get_current_user),
    service: CatalogService = Depends(get_catalog_service),
):
    ensure_catalog_reader(current_user)
    staff = current_user.role in (RoleEnum.ADMIN, RoleEnum.OPERATIONS)
    active_only = not (include_inactive and staff)
    return await service.list_service_offerings(service_slug=service_slug, active_only=active_only)


@router.post("/offerings", response_model=ServiceOfferingResponse)
async def create_service_offering(
    payload: ServiceOfferingCreate,
    _staff: User = Depends(require_staff),
    service: CatalogService = Depends(get_catalog_service),
):
    return await service.create_service_offering(payload)


@router.patch("/offerings/{item_id}", response_model=ServiceOfferingResponse)
async def update_service_offering(
    item_id: UUID,
    payload: ServiceOfferingUpdate,
    _staff: User = Depends(require_staff),
    service: CatalogService = Depends(get_catalog_service),
):
    return await service.update_service_offering(item_id, payload)


@router.delete("/offerings/{item_id}", status_code=204)
async def delete_service_offering(
    item_id: UUID,
    _staff: User = Depends(require_staff),
    service: CatalogService = Depends(get_catalog_service),
):
    await service.delete_service_offering(item_id)
