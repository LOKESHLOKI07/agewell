from uuid import UUID

from fastapi import HTTPException, status

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
    OFFERING_SERVICE_SLUGS,
    ServiceOfferingCreate,
    ServiceOfferingResponse,
    ServiceOfferingsResponse,
    ServiceOfferingUpdate,
    normalize_catalog_image,
)


class CatalogService:
    def __init__(self, repo: CatalogRepository):
        self.repo = repo

    async def get_grocery_catalog(self, *, active_only: bool) -> GroceryCatalogResponse:
        categories = await self.repo.list_grocery_categories(active_only=active_only)
        products = await self.repo.list_grocery_products(active_only=active_only)
        if active_only:
            active_ids = {c.id for c in categories}
            products = [p for p in products if p.category_id in active_ids]
        return GroceryCatalogResponse(
            categories=[GroceryCategoryResponse.model_validate(c) for c in categories],
            products=[GroceryProductResponse.model_validate(p) for p in products],
        )

    async def create_grocery_category(self, payload: GroceryCategoryCreate) -> GroceryCategoryResponse:
        row = await self.repo.create_grocery_category(
            name=payload.name.strip(),
            sort_order=payload.sort_order,
            is_active=payload.is_active,
        )
        await self.repo.session.commit()
        await self.repo.session.refresh(row)
        return GroceryCategoryResponse.model_validate(row)

    async def update_grocery_category(
        self, category_id: UUID, payload: GroceryCategoryUpdate
    ) -> GroceryCategoryResponse:
        row = await self.repo.get_grocery_category(category_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grocery category not found")
        data = payload.model_dump(exclude_unset=True)
        if "name" in data and isinstance(data["name"], str):
            data["name"] = data["name"].strip()
        row = await self.repo.update_grocery_category(row, data)
        await self.repo.session.commit()
        await self.repo.session.refresh(row)
        return GroceryCategoryResponse.model_validate(row)

    async def delete_grocery_category(self, category_id: UUID) -> None:
        row = await self.repo.get_grocery_category(category_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grocery category not found")
        await self.repo.delete_grocery_category(row)
        await self.repo.session.commit()

    async def create_grocery_product(self, payload: GroceryProductCreate) -> GroceryProductResponse:
        category = await self.repo.get_grocery_category(payload.category_id)
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grocery category not found")
        try:
            image = normalize_catalog_image(payload.image)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
        row = await self.repo.create_grocery_product(
            category_id=payload.category_id,
            name=payload.name.strip(),
            unit=payload.unit.strip(),
            price_label=payload.price_label.strip(),
            image=image,
            sort_order=payload.sort_order,
            is_active=payload.is_active,
        )
        await self.repo.session.commit()
        await self.repo.session.refresh(row)
        return GroceryProductResponse.model_validate(row)

    async def update_grocery_product(
        self, product_id: UUID, payload: GroceryProductUpdate
    ) -> GroceryProductResponse:
        row = await self.repo.get_grocery_product(product_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grocery product not found")
        data = payload.model_dump(exclude_unset=True)
        if "category_id" in data:
            category = await self.repo.get_grocery_category(data["category_id"])
            if not category:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grocery category not found")
        if "image" in data:
            try:
                data["image"] = normalize_catalog_image(data["image"])
            except ValueError as exc:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
        for key in ("name", "unit", "price_label"):
            if key in data and isinstance(data[key], str):
                data[key] = data[key].strip()
        row = await self.repo.update_grocery_product(row, data)
        await self.repo.session.commit()
        await self.repo.session.refresh(row)
        return GroceryProductResponse.model_validate(row)

    async def delete_grocery_product(self, product_id: UUID) -> None:
        row = await self.repo.get_grocery_product(product_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grocery product not found")
        await self.repo.delete_grocery_product(row)
        await self.repo.session.commit()

    async def get_food_catalog(self, *, active_only: bool) -> FoodCatalogResponse:
        cuisines = await self.repo.list_food_cuisines(active_only=active_only)
        items = await self.repo.list_food_menu_items(active_only=active_only)
        if active_only:
            active_ids = {c.id for c in cuisines}
            items = [i for i in items if i.cuisine_id in active_ids]
        return FoodCatalogResponse(
            cuisines=[FoodCuisineResponse.model_validate(c) for c in cuisines],
            items=[FoodMenuItemResponse.model_validate(i) for i in items],
        )

    async def create_food_cuisine(self, payload: FoodCuisineCreate) -> FoodCuisineResponse:
        row = await self.repo.create_food_cuisine(
            name=payload.name.strip(),
            description=payload.description.strip(),
            sort_order=payload.sort_order,
            is_active=payload.is_active,
        )
        await self.repo.session.commit()
        await self.repo.session.refresh(row)
        return FoodCuisineResponse.model_validate(row)

    async def update_food_cuisine(self, cuisine_id: UUID, payload: FoodCuisineUpdate) -> FoodCuisineResponse:
        row = await self.repo.get_food_cuisine(cuisine_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food cuisine not found")
        data = payload.model_dump(exclude_unset=True)
        for key in ("name", "description"):
            if key in data and isinstance(data[key], str):
                data[key] = data[key].strip()
        row = await self.repo.update_food_cuisine(row, data)
        await self.repo.session.commit()
        await self.repo.session.refresh(row)
        return FoodCuisineResponse.model_validate(row)

    async def delete_food_cuisine(self, cuisine_id: UUID) -> None:
        row = await self.repo.get_food_cuisine(cuisine_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food cuisine not found")
        await self.repo.delete_food_cuisine(row)
        await self.repo.session.commit()

    async def create_food_menu_item(self, payload: FoodMenuItemCreate) -> FoodMenuItemResponse:
        cuisine = await self.repo.get_food_cuisine(payload.cuisine_id)
        if not cuisine:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food cuisine not found")
        try:
            image = normalize_catalog_image(payload.image)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
        row = await self.repo.create_food_menu_item(
            cuisine_id=payload.cuisine_id,
            meal=payload.meal,
            name=payload.name.strip(),
            price_label=payload.price_label.strip(),
            image=image,
            sort_order=payload.sort_order,
            is_active=payload.is_active,
        )
        await self.repo.session.commit()
        await self.repo.session.refresh(row)
        return FoodMenuItemResponse.model_validate(row)

    async def update_food_menu_item(self, item_id: UUID, payload: FoodMenuItemUpdate) -> FoodMenuItemResponse:
        row = await self.repo.get_food_menu_item(item_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food menu item not found")
        data = payload.model_dump(exclude_unset=True)
        if "cuisine_id" in data:
            cuisine = await self.repo.get_food_cuisine(data["cuisine_id"])
            if not cuisine:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food cuisine not found")
        if "image" in data:
            try:
                data["image"] = normalize_catalog_image(data["image"])
            except ValueError as exc:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
        for key in ("name", "price_label"):
            if key in data and isinstance(data[key], str):
                data[key] = data[key].strip()
        row = await self.repo.update_food_menu_item(row, data)
        await self.repo.session.commit()
        await self.repo.session.refresh(row)
        return FoodMenuItemResponse.model_validate(row)

    async def delete_food_menu_item(self, item_id: UUID) -> None:
        row = await self.repo.get_food_menu_item(item_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food menu item not found")
        await self.repo.delete_food_menu_item(row)
        await self.repo.session.commit()

    def _ensure_offering_slug(self, slug: str) -> str:
        cleaned = slug.strip()
        if cleaned not in OFFERING_SERVICE_SLUGS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unknown or unsupported service slug for offerings.",
            )
        return cleaned

    async def list_service_offerings(
        self,
        *,
        service_slug: str | None,
        active_only: bool,
    ) -> ServiceOfferingsResponse:
        slug = self._ensure_offering_slug(service_slug) if service_slug else None
        rows = await self.repo.list_service_offerings(service_slug=slug, active_only=active_only)
        return ServiceOfferingsResponse(items=[ServiceOfferingResponse.model_validate(row) for row in rows])

    async def create_service_offering(self, payload: ServiceOfferingCreate) -> ServiceOfferingResponse:
        slug = self._ensure_offering_slug(payload.service_slug)
        try:
            image = normalize_catalog_image(payload.image)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
        row = await self.repo.create_service_offering(
            service_slug=slug,
            title=payload.title.strip(),
            description=(payload.description or "").strip(),
            badge=(payload.badge or "").strip(),
            price_label=(payload.price_label or "").strip(),
            image=image,
            meta_json=payload.meta_json,
            sort_order=payload.sort_order,
            is_active=payload.is_active,
        )
        await self.repo.session.commit()
        await self.repo.session.refresh(row)
        return ServiceOfferingResponse.model_validate(row)

    async def update_service_offering(self, item_id: UUID, payload: ServiceOfferingUpdate) -> ServiceOfferingResponse:
        row = await self.repo.get_service_offering(item_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service offering not found")
        data = payload.model_dump(exclude_unset=True)
        if "service_slug" in data and data["service_slug"] is not None:
            data["service_slug"] = self._ensure_offering_slug(data["service_slug"])
        if "image" in data:
            try:
                data["image"] = normalize_catalog_image(data["image"])
            except ValueError as exc:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
        for key in ("title", "description", "badge", "price_label"):
            if key in data and isinstance(data[key], str):
                data[key] = data[key].strip()
        row = await self.repo.update_service_offering(row, data)
        await self.repo.session.commit()
        await self.repo.session.refresh(row)
        return ServiceOfferingResponse.model_validate(row)

    async def delete_service_offering(self, item_id: UUID) -> None:
        row = await self.repo.get_service_offering(item_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service offering not found")
        await self.repo.delete_service_offering(row)
        await self.repo.session.commit()
