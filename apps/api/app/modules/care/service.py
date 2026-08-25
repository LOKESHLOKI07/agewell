import json
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status

from app.modules.audit.repository import AuditRepository
from app.modules.care.models import (
    CARE_STATUS_ACTIVE,
    CARE_STATUS_DISABLED,
    CARE_STATUS_REJECTED,
    CARE_STATUSES,
    CareManager,
)
from app.modules.care.repository import CareManagerRepository
from app.modules.care.schemas import (
    CareManagerApproval,
    CareManagerCreate,
    CareManagerResponse,
    CareManagerUpdate,
    care_manager_display_name,
)
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
        experience=row.experience,
        languages=row.languages,
        availability=row.availability,
        status=row.status,
    )


def normalize_care_status(value: Optional[str], *, default: str = CARE_STATUS_ACTIVE) -> str:
    if value is None or not str(value).strip():
        return default
    status_value = str(value).strip().upper()
    if status_value not in CARE_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid care status. Use one of: {', '.join(sorted(CARE_STATUSES))}",
        )
    return status_value


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

    async def list_care_managers(
        self, *, senior_id: Optional[UUID] = None, status_filter: Optional[str] = None
    ) -> list[CareManagerResponse]:
        rows = (
            await self.repo.list_all()
            if senior_id is None
            else await self.repo.list_associated_with_senior(senior_id)
        )
        if status_filter:
            wanted = normalize_care_status(status_filter)
            rows = [row for row in rows if (row.status or "").upper() == wanted]
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
        status_value = normalize_care_status(payload.status, default=CARE_STATUS_ACTIVE)
        create_payload = CareManagerCreate(
            user_id=payload.user_id,
            employee_id=payload.employee_id,
            first_name=payload.first_name,
            last_name=payload.last_name,
            skills=payload.skills,
            experience=payload.experience,
            languages=payload.languages,
            availability=payload.availability,
            status=status_value,
        )
        row = await self.repo.create(create_payload)
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
        if "status" in data:
            data["status"] = normalize_care_status(data["status"])
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

    async def delete_care_manager(self, care_manager_id: UUID) -> CareManagerResponse:
        from app.modules.people.deletion import commit_people_delete, delete_care_record

        row = await self.repo.get_by_id(care_manager_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Care manager not found")
        response = to_care_manager_response(row)
        await delete_care_record(self.repo.session, care_manager_id, also_user=True)
        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="care_managers",
                entity_id=str(care_manager_id),
                action="DELETE",
                changes=json.dumps({"user_id": str(response.user_id) if response.user_id else None}),
            )
        await commit_people_delete(self.repo.session)
        return response

    async def approve_care_manager(
        self, care_manager_id: UUID, payload: CareManagerApproval
    ) -> CareManagerResponse:
        row = await self.repo.get_by_id(care_manager_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Care manager not found")
        data: dict = {"status": normalize_care_status(payload.status, default=CARE_STATUS_ACTIVE)}
        if data["status"] not in (CARE_STATUS_ACTIVE, CARE_STATUS_REJECTED, CARE_STATUS_DISABLED):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Approval status must be ACTIVE, REJECTED, or DISABLED",
            )
        if payload.employee_id:
            existing = await self.repo.get_by_employee_id(payload.employee_id)
            if existing and existing.id != row.id:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="employee_id already exists")
            data["employee_id"] = payload.employee_id
        elif data["status"] == CARE_STATUS_ACTIVE and (row.employee_id or "").startswith("PEND-"):
            data["employee_id"] = f"CM-{str(row.id).replace('-', '')[:8].upper()}"
        row = await self.repo.update(row, data)
        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="care_managers",
                entity_id=str(row.id),
                action="APPROVE" if data["status"] == CARE_STATUS_ACTIVE else "REVIEW",
                changes=json.dumps(data),
            )
            await self.repo.session.commit()
        return to_care_manager_response(row)
