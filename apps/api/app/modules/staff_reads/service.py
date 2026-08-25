from app.api.schemas import ListPage
from app.modules.addons.models import AddOn
from app.modules.documents.models import DocumentMetadata
from app.modules.orders.models import Order
from app.modules.payments.models import Payment
from app.modules.staff_reads.repository import StaffReadRepository
from app.modules.staff_reads.schemas import (
    AddonItem,
    DocumentItem,
    OrderListItem,
    PaymentListItem,
)


class StaffReadService:
    def __init__(self, repo: StaffReadRepository):
        self.repo = repo

    async def _page(self, model, schema, *, limit: int, offset: int) -> ListPage:
        rows, total = await self.repo.list_rows(model, limit=limit, offset=offset)
        return ListPage(
            items=[schema.model_validate(row) for row in rows],
            total=total,
            limit=limit,
            offset=offset,
        )

    async def list_orders(self, *, limit: int, offset: int):
        return await self._page(Order, OrderListItem, limit=limit, offset=offset)

    async def list_payments(self, *, limit: int, offset: int):
        return await self._page(Payment, PaymentListItem, limit=limit, offset=offset)

    async def list_addons(self, *, limit: int, offset: int):
        return await self._page(AddOn, AddonItem, limit=limit, offset=offset)

    async def list_documents(self, *, limit: int, offset: int):
        return await self._page(DocumentMetadata, DocumentItem, limit=limit, offset=offset)
