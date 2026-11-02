from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.credits.models import (
    CATEGORY_EMERGENCY,
    CATEGORY_SERVICE,
    CreditAccount,
    CreditTransaction,
    ServiceExpense,
    TX_ALLOCATION,
    TX_DEDUCTION,
)


class CreditRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_account(self, senior_id: UUID, category: str) -> Optional[CreditAccount]:
        result = await self.session.execute(
            select(CreditAccount).where(
                CreditAccount.senior_id == senior_id,
                CreditAccount.category == category,
            )
        )
        return result.scalar_one_or_none()

    async def get_account_for_update(self, senior_id: UUID, category: str) -> Optional[CreditAccount]:
        result = await self.session.execute(
            select(CreditAccount)
            .where(
                CreditAccount.senior_id == senior_id,
                CreditAccount.category == category,
            )
            .with_for_update()
        )
        return result.scalar_one_or_none()

    async def list_accounts(self, senior_id: UUID) -> list[CreditAccount]:
        result = await self.session.execute(
            select(CreditAccount).where(CreditAccount.senior_id == senior_id)
        )
        return list(result.scalars().all())

    async def get_allocation(self, senior_id: UUID, category: str) -> Optional[CreditTransaction]:
        result = await self.session.execute(
            select(CreditTransaction).where(
                CreditTransaction.senior_id == senior_id,
                CreditTransaction.category == category,
                CreditTransaction.transaction_type == TX_ALLOCATION,
            )
        )
        return result.scalar_one_or_none()

    async def get_deduction_for_expense(self, expense_id: UUID) -> Optional[CreditTransaction]:
        result = await self.session.execute(
            select(CreditTransaction).where(
                CreditTransaction.expense_id == expense_id,
                CreditTransaction.transaction_type == TX_DEDUCTION,
            )
        )
        return result.scalar_one_or_none()

    async def list_transactions(
        self,
        *,
        senior_id: UUID,
        category: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ):
        stmt = select(CreditTransaction).where(CreditTransaction.senior_id == senior_id)
        count_stmt = select(func.count()).select_from(CreditTransaction).where(
            CreditTransaction.senior_id == senior_id
        )
        if category in (CATEGORY_SERVICE, CATEGORY_EMERGENCY):
            stmt = stmt.where(CreditTransaction.category == category)
            count_stmt = count_stmt.where(CreditTransaction.category == category)
        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(
            stmt.order_by(CreditTransaction.created_at.desc()).offset(offset).limit(limit)
        )
        return list(result.scalars().all()), int(total)

    async def get_expense(self, expense_id: UUID) -> Optional[ServiceExpense]:
        return await self.session.get(ServiceExpense, expense_id)

    async def get_expense_for_update(self, expense_id: UUID) -> Optional[ServiceExpense]:
        result = await self.session.execute(
            select(ServiceExpense).where(ServiceExpense.id == expense_id).with_for_update()
        )
        return result.scalar_one_or_none()

    async def get_open_expense_for_request(self, service_request_id: UUID) -> Optional[ServiceExpense]:
        result = await self.session.execute(
            select(ServiceExpense).where(
                ServiceExpense.service_request_id == service_request_id,
                ServiceExpense.status.in_(["PENDING", "APPROVED"]),
            )
        )
        return result.scalars().first()

    async def get_open_expense_for_emergency(self, emergency_case_id: UUID) -> Optional[ServiceExpense]:
        result = await self.session.execute(
            select(ServiceExpense).where(
                ServiceExpense.emergency_case_id == emergency_case_id,
                ServiceExpense.status.in_(["PENDING", "APPROVED"]),
            )
        )
        return result.scalars().first()

    async def list_expenses(
        self,
        *,
        senior_id: Optional[UUID] = None,
        status: Optional[str] = None,
        submitted_by_user_id: Optional[UUID] = None,
        service_city: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ):
        from app.modules.cities.catalog import apply_city_fk

        stmt = select(ServiceExpense)
        count_stmt = select(func.count()).select_from(ServiceExpense)
        stmt, count_stmt = apply_city_fk(stmt, count_stmt, ServiceExpense.senior_id, service_city)
        if senior_id is not None:
            stmt = stmt.where(ServiceExpense.senior_id == senior_id)
            count_stmt = count_stmt.where(ServiceExpense.senior_id == senior_id)
        if status is not None:
            stmt = stmt.where(ServiceExpense.status == status)
            count_stmt = count_stmt.where(ServiceExpense.status == status)
        if submitted_by_user_id is not None:
            stmt = stmt.where(ServiceExpense.submitted_by_user_id == submitted_by_user_id)
            count_stmt = count_stmt.where(ServiceExpense.submitted_by_user_id == submitted_by_user_id)
        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(
            stmt.order_by(ServiceExpense.created_at.desc()).offset(offset).limit(limit)
        )
        return list(result.scalars().all()), int(total)
