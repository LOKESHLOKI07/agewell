from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_staff
from app.api.schemas import ListPage
from app.modules.staff_reads.repository import StaffReadRepository
from app.modules.staff_reads.schemas import (
    AddonItem,
    DocumentItem,
    OrderListItem,
    PaymentListItem,
)
from app.modules.staff_reads.service import StaffReadService
from app.modules.users.models import User

router_orders = APIRouter()
router_payments = APIRouter()
router_addons = APIRouter()
router_documents = APIRouter()


def get_staff_read_service(db: AsyncSession = Depends(get_db)):
    return StaffReadService(StaffReadRepository(db))


@router_orders.get("/", response_model=ListPage[OrderListItem])
async def list_orders(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    _staff: User = Depends(require_staff),
    service: StaffReadService = Depends(get_staff_read_service),
):
    return await service.list_orders(limit=limit, offset=offset)


@router_payments.get("/", response_model=ListPage[PaymentListItem])
async def list_payments(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    _staff: User = Depends(require_staff),
    service: StaffReadService = Depends(get_staff_read_service),
):
    return await service.list_payments(limit=limit, offset=offset)


@router_addons.get("/", response_model=ListPage[AddonItem])
async def list_addons(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    _staff: User = Depends(require_staff),
    service: StaffReadService = Depends(get_staff_read_service),
):
    return await service.list_addons(limit=limit, offset=offset)


@router_documents.get("/", response_model=ListPage[DocumentItem])
async def list_documents(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    _staff: User = Depends(require_staff),
    service: StaffReadService = Depends(get_staff_read_service),
):
    return await service.list_documents(limit=limit, offset=offset)
