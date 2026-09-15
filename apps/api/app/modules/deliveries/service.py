from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status

from app.api.schemas import ListPage
from app.modules.access.service import AccessService
from app.modules.deliveries.models import DeliveryStatus, StaffDelivery
from app.modules.deliveries.repository import DeliveryRepository
from app.modules.deliveries.schemas import DeliveryResponse, MemberDeliveryResponse
from app.modules.users.models import User


def _executive_name(care_manager) -> Optional[str]:
    if care_manager is None:
        return None
    parts = [care_manager.first_name, care_manager.last_name]
    name = " ".join(part for part in parts if part)
    return name or None


def to_member_delivery(row: StaffDelivery, *, executive_name: Optional[str] = None) -> MemberDeliveryResponse:
    return MemberDeliveryResponse(
        id=row.id,
        care_manager_id=row.care_manager_id,
        senior_id=row.senior_id,
        service_request_id=row.service_request_id,
        title=row.title,
        customer_name=row.customer_name,
        location=row.location,
        status=row.status,
        scheduled_at=row.scheduled_at,
        executive_name=executive_name,
    )


class DeliveryService:
    def __init__(self, repo: DeliveryRepository):
        self.repo = repo

    async def _member_response(self, row: StaffDelivery) -> MemberDeliveryResponse:
        care_manager = await self.repo.get_care_manager(row.care_manager_id)
        return to_member_delivery(row, executive_name=_executive_name(care_manager))

    async def get_member_delivery(self, delivery_id: UUID, user: User, access: AccessService) -> MemberDeliveryResponse:
        row = await self.repo.get_by_id(delivery_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery not found")
        await access.ensure_delivery_access(user, row)
        return await self._member_response(row)

    async def list_member_deliveries(
        self,
        user: User,
        access: AccessService,
        *,
        status_filter: Optional[DeliveryStatus] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> ListPage[MemberDeliveryResponse]:
        senior_id = await access.resolve_senior_id(user, None, allow_unscoped_staff=False)
        rows, total = await self.repo.list_for_senior(
            senior_id, status=status_filter, limit=limit, offset=offset
        )
        items = []
        for row in rows:
            items.append(await self._member_response(row))
        return ListPage(items=items, total=total, limit=limit, offset=offset)
