from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.attendance.models import StaffAttendance
from app.modules.attendance.schemas import AttendanceResponse
from app.modules.care.models import CareManager


def to_attendance_response(row: StaffAttendance) -> AttendanceResponse:
    return AttendanceResponse(
        id=row.id,
        care_manager_id=row.care_manager_id,
        check_in_at=row.check_in_at,
        check_out_at=row.check_out_at,
        location=row.location,
        status="CHECKED_OUT" if row.check_out_at else "CHECKED_IN",
    )


class AttendanceService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _care_manager_for_user(self, user_id: UUID) -> CareManager:
        result = await self.session.execute(select(CareManager).where(CareManager.user_id == user_id))
        row = result.scalar_one_or_none()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Care profile not found")
        return row

    async def get_today(self, user_id: UUID) -> Optional[AttendanceResponse]:
        cm = await self._care_manager_for_user(user_id)
        result = await self.session.execute(
            select(StaffAttendance)
            .where(StaffAttendance.care_manager_id == cm.id, StaffAttendance.check_out_at.is_(None))
            .order_by(StaffAttendance.check_in_at.desc())
            .limit(1)
        )
        row = result.scalar_one_or_none()
        return to_attendance_response(row) if row else None

    async def check_in(self, user_id: UUID, location: Optional[str]) -> AttendanceResponse:
        existing = await self.get_today(user_id)
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already checked in")
        cm = await self._care_manager_for_user(user_id)
        row = StaffAttendance(care_manager_id=cm.id, location=location, check_in_at=datetime.now(timezone.utc))
        self.session.add(row)
        await self.session.commit()
        await self.session.refresh(row)
        return to_attendance_response(row)

    async def check_out(self, user_id: UUID, location: Optional[str]) -> AttendanceResponse:
        cm = await self._care_manager_for_user(user_id)
        result = await self.session.execute(
            select(StaffAttendance)
            .where(StaffAttendance.care_manager_id == cm.id, StaffAttendance.check_out_at.is_(None))
            .order_by(StaffAttendance.check_in_at.desc())
            .limit(1)
        )
        row = result.scalar_one_or_none()
        if not row:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not checked in")
        row.check_out_at = datetime.now(timezone.utc)
        if location:
            row.location = location
        await self.session.commit()
        await self.session.refresh(row)
        return to_attendance_response(row)
