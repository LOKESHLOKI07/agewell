from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_care_associate
from app.modules.attendance.schemas import AttendanceCheckIn, AttendanceCheckOut, AttendanceResponse
from app.modules.attendance.service import AttendanceService
from app.modules.users.models import User

router = APIRouter()


def get_attendance_service(db: AsyncSession = Depends(get_db)):
    return AttendanceService(db)


@router.get("/today", response_model=Optional[AttendanceResponse])
async def get_today_attendance(
    current_user: User = Depends(require_care_associate),
    service: AttendanceService = Depends(get_attendance_service),
):
    return await service.get_today(current_user.id)


@router.post("/check-in", response_model=AttendanceResponse)
async def check_in(
    payload: AttendanceCheckIn,
    current_user: User = Depends(require_care_associate),
    service: AttendanceService = Depends(get_attendance_service),
):
    return await service.check_in(current_user.id, payload.location)


@router.post("/check-out", response_model=AttendanceResponse)
async def check_out(
    payload: AttendanceCheckOut,
    current_user: User = Depends(require_care_associate),
    service: AttendanceService = Depends(get_attendance_service),
):
    return await service.check_out(current_user.id, payload.location)
