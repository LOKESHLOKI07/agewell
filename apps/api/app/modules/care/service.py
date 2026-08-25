import json
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status

from app.modules.audit.repository import AuditRepository
from app.modules.care.models import CareManager
from app.modules.care.repository import CareManagerRepository
from app.modules.care.schemas import CareManagerCreate, CareManagerResponse, CareManagerUpdate, care_manager_display_name
from app.modules.users.models import RoleEnum
from app.modules.users.repository import UserRepository


def to_care_manager_response(row: CareManager) -> CareManagerResponse:
    return CareManagerResponse(
        id=row.id,
        user_id=row.user_id,
        employee_id=row.employee_id,
        name=care_manager_display_name(row.first_name, row.last_name),
        first_name=row.first_name,
        last_name=row.last_name,
        skills=row.skills,
        status=row.status,
    )


class CareManagerService:
    def __init__(
        self,
        repo: CareManagerRepository,
        user_repo: Optional[UserRepository] = None,
        audit_repo: Optional[AuditRepository] = None,
    ):
        self.repo = repo
        self.user_repo = user_repo
        self.audit_repo = audit_repo

    async def get_by_user_id(self, user_id: UUID) -> Optional[CareManagerResponse]:
        row = await self.repo.get_by_user_id(user_id)
        return to_care_manager_response(row) if row else None

    async def get_by_id(self, care_manager_id: UUID) -> CareManagerResponse:
        row = await self.repo.get_by_id(care_manager_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Care manager not found")
        return to_care_manager_response(row)

    async def list_care_managers(self, *, senior_id: Optional[UUID] = None) -> list[CareManagerResponse]:
        rows = (
            await self.repo.list_all()
            if senior_id is None
            else await self.repo.list_associated_with_senior(senior_id)
        )
        return [to_care_manager_response(row) for row in rows]

    async def create_care_manager(self, payload: CareManagerCreate) -> CareManagerResponse:
        if not self.user_repo:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="User repository missing")
        user = await self.user_repo.get_by_id(payload.user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        if user.role != RoleEnum.CARE_MANAGER:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User must have CARE_MANAGER role")
        if await self.repo.get_by_user_id(payload.user_id):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Care manager profile already exists for this user")
        if await self.repo.get_by_employee_id(payload.employee_id):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="employee_id already exists")
        row = await self.repo.create(payload)
        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="care_managers",
                entity_id=str(row.id),
                action="CREATE",
                changes=json.dumps({"user_id": str(payload.user_id), "employee_id": payload.employee_id}),
            )
            await self.repo.session.commit()
        return to_care_manager_response(row)

    async def update_care_manager(self, care_manager_id: UUID, payload: CareManagerUpdate) -> CareManagerResponse:
        row = await self.repo.get_by_id(care_manager_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Care manager not found")
        data = payload.model_dump(exclude_unset=True)
        if "employee_id" in data and data["employee_id"] != row.employee_id:
            existing = await self.repo.get_by_employee_id(data["employee_id"])
            if existing and existing.id != row.id:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="employee_id already exists")
        row = await self.repo.update(row, data)
        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="care_managers",
                entity_id=str(row.id),
                action="UPDATE",
                changes=json.dumps(data),
            )
            await self.repo.session.commit()
        return to_care_manager_response(row)
