from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_care_associate
from app.api.schemas import ListPage
from app.modules.access.repository import AccessRepository
from app.modules.access.service import AccessService, FORBIDDEN
from app.modules.care.models import CareManager
from app.modules.deliveries.models import DeliveryStatus, StaffDelivery
from app.modules.deliveries.repository import DeliveryRepository
from app.modules.deliveries.schemas import DeliveryResponse, DeliveryStatusUpdate, MemberDeliveryResponse
from app.modules.deliveries.service import DeliveryService
from app.modules.seniors.repository import SeniorRepository
from app.modules.users.models import RoleEnum, User

router = APIRouter()


def get_delivery_service(db: AsyncSession = Depends(get_db)) -> DeliveryService:
    return DeliveryService(DeliveryRepository(db))


def get_access_service(db: AsyncSession = Depends(get_db)) -> AccessService:
    return AccessService(AccessRepository(db), SeniorRepository(db))


async def _care_manager(db: AsyncSession, user_id: UUID) -> CareManager:
    result = await db.execute(select(CareManager).where(CareManager.user_id == user_id))
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Care profile not found")
    return row


def _require_member_role(user: User) -> None:
    if user.role not in (RoleEnum.SENIOR, RoleEnum.FAMILY):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)


@router.get("/member", response_model=ListPage[MemberDeliveryResponse])
async def list_member_deliveries(
    status_filter: Optional[DeliveryStatus] = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: DeliveryService = Depends(get_delivery_service),
):
    _require_member_role(current_user)
    return await service.list_member_deliveries(
        current_user, access, status_filter=status_filter, limit=limit, offset=offset
    )


@router.get("/member/{delivery_id}", response_model=MemberDeliveryResponse)
async def get_member_delivery(
    delivery_id: UUID,
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: DeliveryService = Depends(get_delivery_service),
):
    _require_member_role(current_user)
    return await service.get_member_delivery(delivery_id, current_user, access)


@router.get("/", response_model=ListPage[DeliveryResponse])
async def list_deliveries(
    status_filter: Optional[DeliveryStatus] = Query(None, alias="status"),
    today: bool = False,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_care_associate),
    db: AsyncSession = Depends(get_db),
):
    cm = await _care_manager(db, current_user.id)
    stmt = select(StaffDelivery).where(StaffDelivery.care_manager_id == cm.id)
    count_stmt = select(func.count()).select_from(StaffDelivery).where(StaffDelivery.care_manager_id == cm.id)
    if status_filter is not None:
        stmt = stmt.where(StaffDelivery.status == status_filter)
        count_stmt = count_stmt.where(StaffDelivery.status == status_filter)
    total = (await db.execute(count_stmt)).scalar_one()
    result = await db.execute(
        stmt.order_by(StaffDelivery.scheduled_at.asc().nulls_last()).offset(offset).limit(limit)
    )
    rows = list(result.scalars().all())
    return ListPage(
        items=[DeliveryResponse.model_validate(row) for row in rows],
        total=int(total),
        limit=limit,
        offset=offset,
    )


@router.get("/{delivery_id}", response_model=DeliveryResponse)
async def get_delivery(
    delivery_id: UUID,
    current_user: User = Depends(require_care_associate),
    db: AsyncSession = Depends(get_db),
    access: AccessService = Depends(get_access_service),
):
    result = await db.execute(select(StaffDelivery).where(StaffDelivery.id == delivery_id))
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery not found")
    await access.ensure_delivery_access(current_user, row)
    return DeliveryResponse.model_validate(row)


@router.patch("/{delivery_id}", response_model=DeliveryResponse)
async def update_delivery(
    delivery_id: UUID,
    payload: DeliveryStatusUpdate,
    current_user: User = Depends(require_care_associate),
    db: AsyncSession = Depends(get_db),
    access: AccessService = Depends(get_access_service),
):
    result = await db.execute(select(StaffDelivery).where(StaffDelivery.id == delivery_id))
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery not found")
    await access.ensure_delivery_access(current_user, row)
    row.status = payload.status
    await db.commit()
    await db.refresh(row)
    return DeliveryResponse.model_validate(row)
