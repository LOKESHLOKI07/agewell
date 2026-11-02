from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas import ListPage
from app.modules.credits.models import (
    CATEGORY_EMERGENCY,
    CATEGORY_SERVICE,
    CreditAccount,
    CreditTransaction,
    EXPENSE_APPROVED,
    EXPENSE_PENDING,
    EXPENSE_REJECTED,
    ServiceExpense,
    TX_ALLOCATION,
    TX_COMPLETED,
    TX_DEDUCTION,
)
from app.modules.credits.plan_credits import (
    EMERGENCY_SERVICE_SLUGS,
    initial_emergency_credit,
    initial_service_credit,
    money_float,
)
from app.modules.credits.repository import CreditRepository
from app.modules.credits.schemas import (
    AdminExpenseCreate,
    CreditAccountBalance,
    CreditBalancesResponse,
    CreditTransactionResponse,
    ExpenseCreate,
    ExpenseResponse,
)
from app.modules.access.repository import AccessRepository
from app.modules.emergency.models import EmergencyCase
from app.modules.memberships.models import Membership, MembershipPlan
from app.modules.memberships.service import compute_membership_status
from app.modules.notifications.models import NotificationPriority
from app.modules.notifications.repository import NotificationRepository
from app.modules.seniors.models import Senior
from app.modules.services.models import Service, ServiceRequest
from app.modules.users.models import RoleEnum, User


def _empty_balance(category: str) -> CreditAccountBalance:
    return CreditAccountBalance(
        category=category,  # type: ignore[arg-type]
        allocated_amount=0,
        spent_amount=0,
        available_balance=0,
    )


def _account_balance(account: Optional[CreditAccount], category: str) -> CreditAccountBalance:
    if account is None:
        return _empty_balance(category)
    allocated = Decimal(str(account.allocated_amount))
    available = Decimal(str(account.available_balance))
    spent = allocated - available
    if spent < 0:
        spent = Decimal("0.00")
    return CreditAccountBalance(
        category=category,  # type: ignore[arg-type]
        allocated_amount=money_float(allocated),
        spent_amount=money_float(spent),
        available_balance=money_float(available),
    )


def _tx_response(row: CreditTransaction) -> CreditTransactionResponse:
    return CreditTransactionResponse(
        id=row.id,
        senior_id=row.senior_id,
        category=row.category,
        transaction_type=row.transaction_type,
        amount=money_float(row.amount),
        status=row.status,
        description=row.description,
        membership_id=row.membership_id,
        service_request_id=row.service_request_id,
        emergency_case_id=row.emergency_case_id,
        expense_id=row.expense_id,
        created_by_user_id=row.created_by_user_id,
        approved_by_user_id=row.approved_by_user_id,
        created_at=row.created_at,
    )


def _expense_response(row: ServiceExpense) -> ExpenseResponse:
    return ExpenseResponse(
        id=row.id,
        senior_id=row.senior_id,
        category=row.category,
        amount=money_float(row.amount),
        description=row.description,
        status=row.status,
        service_request_id=row.service_request_id,
        emergency_case_id=row.emergency_case_id,
        receipt_document_id=row.receipt_document_id,
        submitted_by_user_id=row.submitted_by_user_id,
        reviewed_by_user_id=row.reviewed_by_user_id,
        reviewed_at=row.reviewed_at,
        rejection_reason=row.rejection_reason,
        created_at=row.created_at,
    )


class CreditService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = CreditRepository(session)
        self.notification_repo = NotificationRepository(session)
        self.access_repo = AccessRepository(session)

    async def _active_membership_row(self, senior_id: UUID):
        result = await self.session.execute(
            select(Membership, MembershipPlan)
            .join(MembershipPlan, Membership.plan_id == MembershipPlan.id)
            .where(Membership.senior_id == senior_id)
            .order_by(Membership.start_date.desc().nulls_last())
        )
        rows = result.all()
        for membership, plan in rows:
            if compute_membership_status(membership.start_date, membership.end_date) == "ACTIVE":
                return membership, plan
        return None

    async def allocate_initial(
        self,
        senior_id: UUID,
        membership: Membership,
        plan: Optional[MembershipPlan],
        *,
        commit: bool = False,
    ) -> None:
        """Idempotent first-time allocation. Never refills on renewal."""
        amounts = {
            CATEGORY_SERVICE: initial_service_credit(plan),
            CATEGORY_EMERGENCY: initial_emergency_credit(plan),
        }
        for category, amount in amounts.items():
            if await self.repo.get_account(senior_id, category):
                continue
            if await self.repo.get_allocation(senior_id, category):
                continue
            account = CreditAccount(
                senior_id=senior_id,
                category=category,
                allocated_amount=amount,
                available_balance=amount,
                membership_id=membership.id,
            )
            self.session.add(account)
            await self.session.flush()
            self.session.add(
                CreditTransaction(
                    senior_id=senior_id,
                    account_id=account.id,
                    category=category,
                    transaction_type=TX_ALLOCATION,
                    amount=amount,
                    status=TX_COMPLETED,
                    description=(
                        "Service credit allocated"
                        if category == CATEGORY_SERVICE
                        else "Emergency credit allocated"
                    ),
                    membership_id=membership.id,
                )
            )
        if commit:
            await self.session.commit()

    async def ensure_allocated(self, senior_id: UUID) -> None:
        row = await self._active_membership_row(senior_id)
        if not row:
            return
        membership, plan = row
        await self.allocate_initial(senior_id, membership, plan, commit=True)

    async def get_balances(self, senior_id: UUID) -> CreditBalancesResponse:
        await self.ensure_allocated(senior_id)
        accounts = {row.category: row for row in await self.repo.list_accounts(senior_id)}
        service = _account_balance(accounts.get(CATEGORY_SERVICE), CATEGORY_SERVICE)
        emergency = _account_balance(accounts.get(CATEGORY_EMERGENCY), CATEGORY_EMERGENCY)
        return CreditBalancesResponse(
            senior_id=senior_id,
            service=service,
            emergency=emergency,
            total_spent_amount=round(service.spent_amount + emergency.spent_amount, 2),
        )

    async def list_transactions(
        self,
        senior_id: UUID,
        *,
        category: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> ListPage[CreditTransactionResponse]:
        await self.ensure_allocated(senior_id)
        rows, total = await self.repo.list_transactions(
            senior_id=senior_id, category=category, limit=limit, offset=offset
        )
        return ListPage(
            items=[_tx_response(row) for row in rows],
            total=total,
            limit=limit,
            offset=offset,
        )

    async def _category_for_service(self, service: Optional[Service]) -> str:
        slug = (getattr(service, "slug", None) or "").strip().lower()
        if slug in EMERGENCY_SERVICE_SLUGS:
            return CATEGORY_EMERGENCY
        return CATEGORY_SERVICE

    async def _submitter_label(self, submitter: User) -> str:
        care = await self.access_repo.get_care_manager_by_user_id(submitter.id)
        if care:
            name = " ".join(
                part for part in (getattr(care, "first_name", None), getattr(care, "last_name", None)) if part
            ).strip()
            kind = (getattr(care, "staff_kind", None) or "CARE_MANAGER").upper()
            kind_label = {
                "CARE_MANAGER": "Care Manager",
                "COMPANION": "Companion",
                "DELIVERY_EXECUTIVE": "Service Companion",
            }.get(kind, kind.replace("_", " ").title())
            if name:
                return f"Submitted by {name} ({kind_label})"
            email = (getattr(submitter, "email", None) or "").strip()
            if email:
                return f"Submitted by {email} ({kind_label})"
            return f"Submitted by {kind_label}"
        email = (getattr(submitter, "email", None) or "").strip()
        if email:
            role = getattr(getattr(submitter, "role", None), "value", None) or str(
                getattr(submitter, "role", "") or ""
            )
            role_label = {
                "ADMIN": "Admin",
                "OPERATIONS": "Operations",
                "CARE_MANAGER": "Care Manager",
            }.get(role, "Staff")
            return f"Submitted by {email} ({role_label})"
        return "Submitted by Staff"

    async def _notify_ops_expense(
        self,
        *,
        expense_id: UUID,
        senior_id: UUID,
        amount: Decimal,
        description: str,
        service_label: str,
        submitter: User,
    ) -> None:
        senior = await self.session.get(Senior, senior_id)
        senior_name = " ".join(
            part for part in (getattr(senior, "first_name", None), getattr(senior, "last_name", None)) if part
        ).strip() or "Member"
        amount_value = money_float(amount)
        amount_label = f"₹{amount_value:g}" if amount_value == int(amount_value) else f"₹{amount_value:.2f}"
        title = "Expense approval needed"
        submitter_label = await self._submitter_label(submitter)
        message = (
            f"{service_label} · {amount_label} · {description} · Senior {senior_name} · {submitter_label}"
        )
        action_ref = f"expense:{expense_id}"
        for user_id in await self.access_repo.list_ops_user_ids():
            await self.notification_repo.create(
                user_id=user_id,
                title=title,
                message=message,
                priority=NotificationPriority.IMPORTANT,
                action_ref=action_ref,
            )
        await self.session.commit()

    async def submit_expense(self, payload: ExpenseCreate, user: User) -> ExpenseResponse:
        if user.role not in (RoleEnum.CARE_MANAGER, RoleEnum.ADMIN, RoleEnum.OPERATIONS):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

        amount = Decimal(str(payload.amount)).quantize(Decimal("0.01"))
        if amount <= 0:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Amount must be greater than 0.")

        description = (payload.description or "").strip() or None
        category = CATEGORY_SERVICE
        senior_id: Optional[UUID] = None
        service_label = "Service expense"

        if payload.service_request_id:
            request = await self.session.get(ServiceRequest, payload.service_request_id)
            if not request:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service request not found")
            service = await self.session.get(Service, request.service_id) if request.service_id else None
            category = await self._category_for_service(service)
            senior_id = request.senior_id
            service_label = service.name if service and service.name else "Service expense"
            if await self.repo.get_open_expense_for_request(request.id):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An expense is already pending or approved for this service.",
                )
            if not description:
                description = service_label
        else:
            case = await self.session.get(EmergencyCase, payload.emergency_case_id)
            if not case:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency case not found")
            category = CATEGORY_EMERGENCY
            senior_id = case.senior_id
            service_label = "Emergency"
            if await self.repo.get_open_expense_for_emergency(case.id):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An expense is already pending or approved for this emergency.",
                )
            if not description:
                description = "Emergency expense"

        if senior_id is None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Senior is required.")

        expense = ServiceExpense(
            senior_id=senior_id,
            category=category,
            amount=amount,
            description=description,
            status=EXPENSE_PENDING,
            service_request_id=payload.service_request_id,
            emergency_case_id=payload.emergency_case_id,
            receipt_document_id=payload.receipt_document_id,
            submitted_by_user_id=user.id,
        )
        self.session.add(expense)
        try:
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An expense is already pending or approved for this service.",
            )
        await self.session.refresh(expense)
        await self._notify_ops_expense(
            expense_id=expense.id,
            senior_id=senior_id,
            amount=amount,
            description=description or service_label,
            service_label=service_label,
            submitter=user,
        )
        return _expense_response(expense)

    async def get_expense(self, expense_id: UUID, user: User) -> ExpenseResponse:
        expense = await self.repo.get_expense(expense_id)
        if not expense:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
        await self._ensure_expense_visible(expense, user)
        return _expense_response(expense)

    async def list_expenses(
        self,
        user: User,
        *,
        senior_id: Optional[UUID],
        status_filter: Optional[str],
        limit: int,
        offset: int,
    ) -> ListPage[ExpenseResponse]:
        submitted_by = None
        if user.role == RoleEnum.CARE_MANAGER:
            submitted_by = user.id
        from app.modules.cities.catalog import staff_city

        rows, total = await self.repo.list_expenses(
            senior_id=senior_id,
            status=status_filter,
            submitted_by_user_id=submitted_by,
            service_city=staff_city(user),
            limit=limit,
            offset=offset,
        )
        return ListPage(
            items=[_expense_response(row) for row in rows],
            total=total,
            limit=limit,
            offset=offset,
        )

    async def record_admin_expense(self, payload: AdminExpenseCreate, user: User) -> ExpenseResponse:
        if user.role not in (RoleEnum.ADMIN, RoleEnum.OPERATIONS):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

        amount = Decimal(str(payload.amount)).quantize(Decimal("0.01"))
        if amount <= 0:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Amount must be greater than 0.")

        description = payload.description.strip()
        if not description:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Description is required.")

        from app.modules.cities.catalog import ensure_staff_city_for_senior

        senior = await self.session.get(Senior, payload.senior_id)
        if not senior:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Senior not found")
        ensure_staff_city_for_senior(user, senior)

        await self.ensure_allocated(payload.senior_id)
        expense = ServiceExpense(
            senior_id=payload.senior_id,
            category=payload.category,
            amount=amount,
            description=description,
            status=EXPENSE_PENDING,
            submitted_by_user_id=user.id,
        )
        self.session.add(expense)
        await self.session.flush()
        await self._deduct_expense(expense, user)
        try:
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This expense is already approved.",
            )
        await self.session.refresh(expense)
        return _expense_response(expense)

    async def approve_expense(self, expense_id: UUID, user: User) -> ExpenseResponse:
        if user.role not in (RoleEnum.ADMIN, RoleEnum.OPERATIONS):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

        expense = await self.repo.get_expense_for_update(expense_id)
        if not expense:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
        if expense.status == EXPENSE_APPROVED or await self.repo.get_deduction_for_expense(expense.id):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This expense is already approved.")
        if expense.status != EXPENSE_PENDING:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Only pending expenses can be approved.",
            )

        await self._deduct_expense(expense, user)
        try:
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This expense is already approved.",
            )
        await self.session.refresh(expense)
        return _expense_response(expense)

    async def _deduct_expense(self, expense: ServiceExpense, user: User) -> None:
        account = await self.repo.get_account_for_update(expense.senior_id, expense.category)
        if account is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Credit account has not been allocated for this member.",
            )

        amount = Decimal(str(expense.amount))
        available = Decimal(str(account.available_balance))
        if available < amount:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Insufficient credit balance for this expense.",
            )

        account.available_balance = (available - amount).quantize(Decimal("0.01"))
        expense.status = EXPENSE_APPROVED
        expense.reviewed_by_user_id = user.id
        expense.reviewed_at = datetime.now(timezone.utc)
        self.session.add(
            CreditTransaction(
                senior_id=expense.senior_id,
                account_id=account.id,
                category=expense.category,
                transaction_type=TX_DEDUCTION,
                amount=amount,
                status=TX_COMPLETED,
                description=expense.description,
                service_request_id=expense.service_request_id,
                emergency_case_id=expense.emergency_case_id,
                expense_id=expense.id,
                created_by_user_id=expense.submitted_by_user_id,
                approved_by_user_id=user.id,
            )
        )

    async def reject_expense(self, expense_id: UUID, user: User, reason: Optional[str]) -> ExpenseResponse:
        if user.role not in (RoleEnum.ADMIN, RoleEnum.OPERATIONS):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

        expense = await self.repo.get_expense_for_update(expense_id)
        if not expense:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
        if expense.status == EXPENSE_APPROVED:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Approved expenses cannot be rejected.")
        if expense.status != EXPENSE_PENDING:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Only pending expenses can be rejected.",
            )

        expense.status = EXPENSE_REJECTED
        expense.reviewed_by_user_id = user.id
        expense.reviewed_at = datetime.now(timezone.utc)
        expense.rejection_reason = (reason or "").strip() or None
        await self.session.commit()
        await self.session.refresh(expense)
        return _expense_response(expense)

    async def _ensure_expense_visible(self, expense: ServiceExpense, user: User) -> None:
        if user.role in (RoleEnum.ADMIN, RoleEnum.OPERATIONS):
            from app.modules.cities.catalog import ensure_staff_city_for_senior

            senior = await self.session.get(Senior, expense.senior_id)
            ensure_staff_city_for_senior(user, senior)
            return
        if user.role == RoleEnum.CARE_MANAGER and expense.submitted_by_user_id == user.id:
            return
        if user.role == RoleEnum.SENIOR:
            from app.modules.seniors.models import Senior

            senior = (
                await self.session.execute(select(Senior).where(Senior.user_id == user.id))
            ).scalar_one_or_none()
            if senior and senior.id == expense.senior_id:
                return
        if user.role == RoleEnum.FAMILY:
            from app.modules.access.repository import AccessRepository

            access = AccessRepository(self.session)
            family = await access.get_family_member_by_user_id(user.id)
            if family and await access.has_family_senior_access(family.id, expense.senior_id):
                return
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
