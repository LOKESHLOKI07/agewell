from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.catalog.models import FoodCuisine, FoodMenuItem, GroceryCategory, GroceryProduct, ServiceOffering


class CatalogRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_grocery_categories(self, *, active_only: bool = False) -> list[GroceryCategory]:
        stmt = select(GroceryCategory).order_by(GroceryCategory.sort_order.asc(), GroceryCategory.name.asc())
        if active_only:
            stmt = stmt.where(GroceryCategory.is_active.is_(True))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_grocery_category(self, category_id: UUID) -> Optional[GroceryCategory]:
        result = await self.session.execute(select(GroceryCategory).where(GroceryCategory.id == category_id))
        return result.scalars().first()

    async def create_grocery_category(self, **kwargs) -> GroceryCategory:
        row = GroceryCategory(**kwargs)
        self.session.add(row)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def update_grocery_category(self, row: GroceryCategory, data: dict) -> GroceryCategory:
        for field, value in data.items():
            setattr(row, field, value)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def delete_grocery_category(self, row: GroceryCategory) -> None:
        products = await self.list_grocery_products(category_id=row.id, active_only=False)
        for product in products:
            await self.session.delete(product)
        await self.session.delete(row)
        await self.session.flush()

    async def list_grocery_products(
        self,
        *,
        category_id: Optional[UUID] = None,
        active_only: bool = False,
    ) -> list[GroceryProduct]:
        stmt = select(GroceryProduct).order_by(GroceryProduct.sort_order.asc(), GroceryProduct.name.asc())
        if category_id is not None:
            stmt = stmt.where(GroceryProduct.category_id == category_id)
        if active_only:
            stmt = stmt.where(GroceryProduct.is_active.is_(True))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_grocery_product(self, product_id: UUID) -> Optional[GroceryProduct]:
        result = await self.session.execute(select(GroceryProduct).where(GroceryProduct.id == product_id))
        return result.scalars().first()

    async def create_grocery_product(self, **kwargs) -> GroceryProduct:
        row = GroceryProduct(**kwargs)
        self.session.add(row)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def update_grocery_product(self, row: GroceryProduct, data: dict) -> GroceryProduct:
        for field, value in data.items():
            setattr(row, field, value)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def delete_grocery_product(self, row: GroceryProduct) -> None:
        await self.session.delete(row)
        await self.session.flush()

    async def list_food_cuisines(self, *, active_only: bool = False) -> list[FoodCuisine]:
        stmt = select(FoodCuisine).order_by(FoodCuisine.sort_order.asc(), FoodCuisine.name.asc())
        if active_only:
            stmt = stmt.where(FoodCuisine.is_active.is_(True))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_food_cuisine(self, cuisine_id: UUID) -> Optional[FoodCuisine]:
        result = await self.session.execute(select(FoodCuisine).where(FoodCuisine.id == cuisine_id))
        return result.scalars().first()

    async def create_food_cuisine(self, **kwargs) -> FoodCuisine:
        row = FoodCuisine(**kwargs)
        self.session.add(row)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def update_food_cuisine(self, row: FoodCuisine, data: dict) -> FoodCuisine:
        for field, value in data.items():
            setattr(row, field, value)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def delete_food_cuisine(self, row: FoodCuisine) -> None:
        items = await self.list_food_menu_items(cuisine_id=row.id, active_only=False)
        for item in items:
            await self.session.delete(item)
        await self.session.delete(row)
        await self.session.flush()

    async def list_food_menu_items(
        self,
        *,
        cuisine_id: Optional[UUID] = None,
        active_only: bool = False,
    ) -> list[FoodMenuItem]:
        stmt = select(FoodMenuItem).order_by(FoodMenuItem.sort_order.asc(), FoodMenuItem.name.asc())
        if cuisine_id is not None:
            stmt = stmt.where(FoodMenuItem.cuisine_id == cuisine_id)
        if active_only:
            stmt = stmt.where(FoodMenuItem.is_active.is_(True))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_food_menu_item(self, item_id: UUID) -> Optional[FoodMenuItem]:
        result = await self.session.execute(select(FoodMenuItem).where(FoodMenuItem.id == item_id))
        return result.scalars().first()

    async def create_food_menu_item(self, **kwargs) -> FoodMenuItem:
        row = FoodMenuItem(**kwargs)
        self.session.add(row)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def update_food_menu_item(self, row: FoodMenuItem, data: dict) -> FoodMenuItem:
        for field, value in data.items():
            setattr(row, field, value)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def delete_food_menu_item(self, row: FoodMenuItem) -> None:
        await self.session.delete(row)
        await self.session.flush()

    async def list_service_offerings(
        self,
        *,
        service_slug: Optional[str] = None,
        active_only: bool = False,
    ) -> list[ServiceOffering]:
        stmt = select(ServiceOffering).order_by(
            ServiceOffering.service_slug.asc(),
            ServiceOffering.sort_order.asc(),
            ServiceOffering.title.asc(),
        )
        if service_slug is not None:
            stmt = stmt.where(ServiceOffering.service_slug == service_slug)
        if active_only:
            stmt = stmt.where(ServiceOffering.is_active.is_(True))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_service_offering(self, item_id: UUID) -> Optional[ServiceOffering]:
        result = await self.session.execute(select(ServiceOffering).where(ServiceOffering.id == item_id))
        return result.scalars().first()

    async def create_service_offering(self, **kwargs) -> ServiceOffering:
        row = ServiceOffering(**kwargs)
        self.session.add(row)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def update_service_offering(self, row: ServiceOffering, data: dict) -> ServiceOffering:
        for field, value in data.items():
            setattr(row, field, value)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def delete_service_offering(self, row: ServiceOffering) -> None:
        await self.session.delete(row)
        await self.session.flush()
