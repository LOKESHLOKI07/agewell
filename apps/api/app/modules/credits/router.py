from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_care_or_staff, require_staff
from app.api.schemas import ListPage
from app.modules.access.repository import AccessRepository
from app.modules.access.service import AccessService
from app.modules.credits.models import CATEGORY_EMERGENCY, CATEGORY_SERVICE, EXPENSE_STATUSES
from app.modules.credits.schemas import (
    AdminExpenseCreate,
    CreditBalancesResponse,
    CreditTransactionResponse,
    ExpenseCreate,
    ExpenseReject,
    ExpenseResponse,
)
from app.modules.credits.service import CreditService
from app.modules.seniors.repository import SeniorRepository
from app.modules.users.models import RoleEnum, User

router = APIRouter()


def get_credit_service(db: AsyncSession = Depends(get_db)) -> CreditService:
    return CreditService(db)


def get_access_service(db: AsyncSession = Depends(get_db)) -> AccessService:
    return AccessService(AccessRepository(db), SeniorRepository(db))


async def resolve_credit_senior_id(
    user: User,
    senior_id: Optional[UUID],
    access: AccessService,
) -> UUID:
    if user.role == RoleEnum.FAMILY and senior_id is None:
        family = await access.access_repo.get_family_member_by_user_id(user.id)
        if not family:
            raise HTTPException(status_code=403, detail="You don't have permission to access this information.")
        ids = await access.access_repo.list_family_senior_ids(family.id)
        if not ids:
            raise HTTPException(status_code=404, detail="No linked senior found.")
        return ids[0]
    scoped = await access.resolve_senior_id(user, senior_id)
    if scoped is None:
        raise HTTPException(status_code=400, detail="senior_id is required")
    return scoped


@router.get("/balances", response_model=CreditBalancesResponse)
async def get_credit_balances(
    senior_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: CreditService = Depends(get_credit_service),
):
    scoped = await resolve_credit_senior_id(current_user, senior_id, access)
    return await service.get_balances(scoped)


@router.get("/transactions", response_model=ListPage[CreditTransactionResponse])
async def list_credit_transactions(
    senior_id: Optional[UUID] = None,
    category: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: CreditService = Depends(get_credit_service),
):
    scoped = await resolve_credit_senior_id(current_user, senior_id, access)
    if category not in (None, CATEGORY_SERVICE, CATEGORY_EMERGENCY):
        category = None
    return await service.list_transactions(scoped, category=category, limit=limit, offset=offset)


@router.get("/expenses", response_model=ListPage[ExpenseResponse])
async def list_expenses(
    senior_id: Optional[UUID] = None,
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    access: AccessService = Depends(get_access_service),
    service: CreditService = Depends(get_credit_service),
):
    scoped = None
    if current_user.role in (RoleEnum.SENIOR, RoleEnum.FAMILY):
        scoped = await resolve_credit_senior_id(current_user, senior_id, access)
    elif senior_id is not None:
        scoped = await access.resolve_senior_id(current_user, senior_id, allow_unscoped_staff=True)
    if status is not None and status not in EXPENSE_STATUSES:
        raise HTTPException(status_code=422, detail="Unknown expense status.")
    return await service.list_expenses(
        current_user,
        senior_id=scoped,
        status_filter=status,
        limit=limit,
        offset=offset,
    )


@router.get("/expenses/{expense_id}", response_model=ExpenseResponse)
async def get_expense(
    expense_id: UUID,
    current_user: User = Depends(get_current_user),
    service: CreditService = Depends(get_credit_service),
):
    return await service.get_expense(expense_id, current_user)


@router.post("/expenses", response_model=ExpenseResponse)
async def submit_expense(
    payload: ExpenseCreate,
    current_user: User = Depends(require_care_or_staff),
    service: CreditService = Depends(get_credit_service),
):
    return await service.submit_expense(payload, current_user)


@router.post("/expenses/record", response_model=ExpenseResponse)
async def record_admin_expense(
    payload: AdminExpenseCreate,
    current_user: User = Depends(require_staff),
    service: CreditService = Depends(get_credit_service),
):
    return await service.record_admin_expense(payload, current_user)


@router.post("/expenses/{expense_id}/approve", response_model=ExpenseResponse)
async def approve_expense(
    expense_id: UUID,
    current_user: User = Depends(require_staff),
    service: CreditService = Depends(get_credit_service),
):
    return await service.approve_expense(expense_id, current_user)


@router.post("/expenses/{expense_id}/reject", response_model=ExpenseResponse)
async def reject_expense(
    expense_id: UUID,
    payload: ExpenseReject | None = None,
    current_user: User = Depends(require_staff),
    service: CreditService = Depends(get_credit_service),
):
    reason = payload.reason if payload else None
    return await service.reject_expense(expense_id, current_user, reason)
