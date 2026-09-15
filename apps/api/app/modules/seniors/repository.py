from datetime import datetime, timezone

from sqlalchemy import Date, cast, exists, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.memberships.models import Membership
from app.modules.seniors.models import Senior
from app.modules.seniors.schemas import SeniorCreate
from app.modules.seniors.service_area import effective_in_service_area_sql
from app.modules.users.models import User

SENIOR_SEGMENTS = frozenset({"membership", "outside_area", "in_area_no_membership"})


class SeniorRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, senior_id):
        stmt = select(Senior).where(Senior.id == senior_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_by_user_id(self, user_id):
        stmt = select(Senior).where(Senior.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_with_user(self, senior_id):
        result = await self.session.execute(
            select(Senior, User).outerjoin(User, Senior.user_id == User.id).where(Senior.id == senior_id)
        )
        return result.first()

    async def create(self, senior: SeniorCreate) -> Senior:
        db_senior = Senior(**senior.model_dump())
        self.session.add(db_senior)
        await self.session.commit()
        await self.session.refresh(db_senior)
        return db_senior

    async def update(self, senior: Senior, data: dict) -> Senior:
        for field, value in data.items():
            setattr(senior, field, value)
        await self.session.commit()
        await self.session.refresh(senior)
        return senior

    def _membership_exists(self):
        today = datetime.now(timezone.utc).date()
        return exists().where(
            Membership.senior_id == Senior.id,
            or_(Membership.start_date.is_(None), cast(Membership.start_date, Date) <= today),
            or_(Membership.end_date.is_(None), cast(Membership.end_date, Date) >= today),
        )

    def _apply_segment(self, stmt, segment: str | None):
        if not segment or segment not in SENIOR_SEGMENTS:
            return stmt
        in_area = effective_in_service_area_sql(Senior)
        has_membership = self._membership_exists()
        if segment == "membership":
            return stmt.where(has_membership)
        if segment == "outside_area":
            return stmt.where(~in_area)
        if segment == "in_area_no_membership":
            return stmt.where(in_area, ~has_membership)
        return stmt

    async def list_seniors(self, *, limit: int = 50, offset: int = 0, segment: str | None = None):
        has_membership = self._membership_exists()
        base = (
            select(
                Senior,
                User.email,
                User.phone,
                User.account_status,
                has_membership.label("has_membership"),
            )
            .outerjoin(User, Senior.user_id == User.id)
        )
        base = self._apply_segment(base, segment)

        count_stmt = select(func.count()).select_from(base.order_by(None).subquery())
        total = (await self.session.execute(count_stmt)).scalar_one()

        result = await self.session.execute(
            base.order_by(Senior.last_name.asc().nulls_last(), Senior.first_name.asc().nulls_last())
            .offset(offset)
            .limit(limit)
        )
        return result.all(), int(total)

    async def senior_has_membership(self, senior_id) -> bool:
        today = datetime.now(timezone.utc).date()
        result = await self.session.execute(
            select(func.count())
            .select_from(Membership)
            .where(
                Membership.senior_id == senior_id,
                or_(Membership.start_date.is_(None), cast(Membership.start_date, Date) <= today),
                or_(Membership.end_date.is_(None), cast(Membership.end_date, Date) >= today),
            )
        )
        return int(result.scalar_one()) > 0
