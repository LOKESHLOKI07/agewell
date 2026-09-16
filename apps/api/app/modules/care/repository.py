from typing import Optional, Sequence
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.care.models import (
    CARE_STAFF_KIND_CARE_MANAGER,
    CARE_STAFF_KIND_COMPANION,
    CareManager,
    CareManagerActivity,
)
from app.modules.seniors.models import Senior
from app.modules.users.models import User
from app.modules.visits.models import Visit


class CareManagerRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_user_id(self, user_id: UUID) -> Optional[CareManager]:
        result = await self.session.execute(select(CareManager).where(CareManager.user_id == user_id))
        return result.scalars().first()

    async def list_all(self) -> list[CareManager]:
        result = await self.session.execute(select(CareManager).order_by(CareManager.employee_id.asc().nulls_last()))
        return list(result.scalars().all())

    async def list_associated_with_senior(self, senior_id: UUID) -> list[CareManager]:
        stmt = (
            select(CareManager)
            .join(Visit, Visit.care_manager_id == CareManager.id)
            .where(Visit.senior_id == senior_id)
            .distinct()
            .order_by(CareManager.employee_id.asc().nulls_last())
        )
        result = await self.session.execute(stmt)
        rows = list(result.scalars().all())
        standing = await self.get_standing_assignment(senior_id)
        if standing and all(row.id != standing.id for row in rows):
            rows.insert(0, standing)
        standing_companion = await self.get_standing_assignment(senior_id, CARE_STAFF_KIND_COMPANION)
        if standing_companion and all(row.id != standing_companion.id for row in rows):
            rows.insert(0 if not standing else 1, standing_companion)
        return rows

    async def get_standing_assignment(
        self,
        senior_id: UUID,
        staff_kind: str = CARE_STAFF_KIND_CARE_MANAGER,
    ) -> Optional[CareManager]:
        senior = (
            await self.session.execute(select(Senior).where(Senior.id == senior_id))
        ).scalars().first()
        kind = (staff_kind or CARE_STAFF_KIND_CARE_MANAGER).upper()
        if kind == CARE_STAFF_KIND_COMPANION:
            assigned_id = getattr(senior, "companion_id", None) if senior else None
            expected = CARE_STAFF_KIND_COMPANION
        else:
            assigned_id = getattr(senior, "care_manager_id", None) if senior else None
            expected = CARE_STAFF_KIND_CARE_MANAGER
        if not assigned_id:
            return None
        row = await self.get_by_id(assigned_id)
        if not row:
            return None
        row_kind = (row.staff_kind or CARE_STAFF_KIND_CARE_MANAGER).upper()
        if row_kind != expected:
            return None
        return row

    async def get_assigned_for_senior(
        self,
        senior_id: UUID,
        staff_kind: str = CARE_STAFF_KIND_CARE_MANAGER,
    ) -> Optional[CareManager]:
        kind = (staff_kind or CARE_STAFF_KIND_CARE_MANAGER).upper()
        standing = await self.get_standing_assignment(senior_id, kind)
        if standing:
            return standing
        if kind == CARE_STAFF_KIND_CARE_MANAGER:
            stmt = (
                select(CareManager)
                .join(Visit, Visit.care_manager_id == CareManager.id)
                .where(
                    Visit.senior_id == senior_id,
                    or_(
                        CareManager.staff_kind == CARE_STAFF_KIND_CARE_MANAGER,
                        CareManager.staff_kind.is_(None),
                    ),
                )
                .order_by(Visit.scheduled_at.desc().nulls_last())
                .limit(1)
            )
        else:
            stmt = (
                select(CareManager)
                .join(Visit, Visit.care_manager_id == CareManager.id)
                .where(
                    Visit.senior_id == senior_id,
                    CareManager.staff_kind == kind,
                )
                .order_by(Visit.scheduled_at.desc().nulls_last())
                .limit(1)
            )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_user_phone(self, user_id: Optional[UUID]) -> Optional[str]:
        if not user_id:
            return None
        user = (await self.session.execute(select(User).where(User.id == user_id))).scalars().first()
        return user.phone if user else None

    async def get_activity(self, activity_id: UUID) -> Optional[tuple[CareManagerActivity, Optional[CareManager]]]:
        result = await self.session.execute(
            select(CareManagerActivity, CareManager)
            .outerjoin(CareManager, CareManagerActivity.care_manager_id == CareManager.id)
            .where(CareManagerActivity.id == activity_id)
        )
        row = result.first()
        return (row[0], row[1]) if row else None

    async def list_activities(
        self,
        *,
        senior_id: Optional[UUID] = None,
        senior_ids: Optional[Sequence[UUID]] = None,
        care_manager_id: Optional[UUID] = None,
        limit: int = 50,
        offset: int = 0,
    ):
        from sqlalchemy import func

        stmt = select(CareManagerActivity, CareManager).outerjoin(
            CareManager, CareManagerActivity.care_manager_id == CareManager.id
        )
        count_stmt = select(func.count()).select_from(CareManagerActivity)
        if senior_id is not None:
            stmt = stmt.where(CareManagerActivity.senior_id == senior_id)
            count_stmt = count_stmt.where(CareManagerActivity.senior_id == senior_id)
        elif senior_ids is not None:
            if len(senior_ids) == 0:
                return [], 0
            stmt = stmt.where(CareManagerActivity.senior_id.in_(list(senior_ids)))
            count_stmt = count_stmt.where(CareManagerActivity.senior_id.in_(list(senior_ids)))
        if care_manager_id is not None:
            stmt = stmt.where(CareManagerActivity.care_manager_id == care_manager_id)
            count_stmt = count_stmt.where(CareManagerActivity.care_manager_id == care_manager_id)
        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(
            stmt.order_by(CareManagerActivity.occurred_at.desc().nulls_last()).offset(offset).limit(limit)
        )
        return result.all(), int(total)

    async def add_activity(self, row: CareManagerActivity) -> CareManagerActivity:
        self.session.add(row)
        await self.session.flush()
        await self.session.refresh(row)
        return row

    async def get_by_id(self, care_manager_id: UUID) -> Optional[CareManager]:
        result = await self.session.execute(select(CareManager).where(CareManager.id == care_manager_id))
        return result.scalars().first()

    async def get_by_employee_id(self, employee_id: str) -> Optional[CareManager]:
        result = await self.session.execute(select(CareManager).where(CareManager.employee_id == employee_id))
        return result.scalars().first()

    async def create(self, payload) -> CareManager:
        row = CareManager(
            user_id=payload.user_id,
            employee_id=payload.employee_id,
            first_name=payload.first_name,
            last_name=payload.last_name,
            skills=payload.skills,
            experience=getattr(payload, "experience", None),
            languages=getattr(payload, "languages", None),
            availability=getattr(payload, "availability", None),
            status=payload.status,
            staff_kind=getattr(payload, "staff_kind", None) or "CARE_MANAGER",
        )
        self.session.add(row)
        await self.session.commit()
        await self.session.refresh(row)
        return row

    async def update(self, row: CareManager, data: dict) -> CareManager:
        for field, value in data.items():
            setattr(row, field, value)
        await self.session.commit()
        await self.session.refresh(row)
        return row
