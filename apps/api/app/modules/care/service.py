import json
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status

from app.modules.audit.repository import AuditRepository
from app.modules.care.companion_services import (
    canonicalize_staff_kind,
    companion_service_slugs_for,
    is_service_companion_kind,
    normalize_companion_service_slugs,
)
from app.modules.care.models import (
    CARE_STAFF_KIND_CARE_MANAGER,
    CARE_STAFF_KIND_COMPANION,
    CARE_STAFF_KINDS,
    CARE_STATUS_ACTIVE,
    CARE_STATUS_DISABLED,
    CARE_STATUS_ON_LEAVE,
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
    CaseloadPreviewResponse,
    CaseloadRestoreResponse,
    CaseloadTransferRequest,
    CaseloadTransferResponse,
    StaffProvisionRequest,
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
        staff_kind=row.staff_kind or CARE_STAFF_KIND_CARE_MANAGER,
        companion_service_slugs=companion_service_slugs_for(row.staff_kind, row.companion_service_slugs),
    )


def normalize_staff_kind(value: Optional[str], *, default: str = CARE_STAFF_KIND_CARE_MANAGER) -> str:
    if value is None or not str(value).strip():
        return default
    kind = canonicalize_staff_kind(str(value))
    if kind not in CARE_STAFF_KINDS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid staff kind. Use one of: {', '.join(sorted(CARE_STAFF_KINDS))}",
        )
    return kind


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

    async def get_by_id(self, care_manager_id: UUID, *, actor=None) -> CareManagerResponse:
        row = await self.repo.get_by_id(care_manager_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Care manager not found")
        await self._ensure_care_visible(row, actor)
        return to_care_manager_response(row)

    async def _ensure_care_visible(self, row: CareManager, actor) -> None:
        from app.modules.cities.catalog import ensure_staff_can_see_user, staff_city

        if actor is None or not staff_city(actor):
            return
        if not row.user_id or not self.user_repo:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Care manager not found")
        user = await self.user_repo.get_by_id(row.user_id)
        ensure_staff_can_see_user(actor, user)

    async def list_care_managers(
        self,
        *,
        senior_id: Optional[UUID] = None,
        status_filter: Optional[str] = None,
        service_city: Optional[str] = None,
    ) -> list[CareManagerResponse]:
        rows = (
            await self.repo.list_all(service_city=service_city)
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
        staff_kind = normalize_staff_kind(payload.staff_kind)
        slugs = normalize_companion_service_slugs(
            payload.companion_service_slugs,
            required=is_service_companion_kind(staff_kind),
        )
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
            staff_kind=staff_kind,
            companion_service_slugs=slugs if is_service_companion_kind(staff_kind) else [],
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
        if "staff_kind" in data:
            data["staff_kind"] = normalize_staff_kind(data["staff_kind"])
        next_kind = data.get("staff_kind", row.staff_kind)
        if "companion_service_slugs" in data or "staff_kind" in data:
            slugs = normalize_companion_service_slugs(
                data.get("companion_service_slugs", row.companion_service_slugs),
                required=is_service_companion_kind(next_kind),
            )
            data["companion_service_slugs"] = slugs if is_service_companion_kind(next_kind) else []
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

    async def provision_staff(self, payload: StaffProvisionRequest, *, actor=None) -> CareManagerResponse:
        if not self.user_repo:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="User repository missing")
        from app.modules.users.models import AccountStatus
        from app.modules.users.schemas import UserCreate
        from app.modules.users.service import UserService

        if await self.repo.get_by_employee_id(payload.employee_id):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="employee_id already exists")

        user_service = UserService(self.user_repo, self.audit_repo)
        user = await user_service.create_user(
            UserCreate(
                email=payload.email,
                phone=payload.phone,
                password=payload.password,
                role=RoleEnum.CARE_MANAGER,
                account_status=AccountStatus.ACTIVE,
                service_city=getattr(payload, "service_city", None),
            ),
            actor=actor,
        )
        status_value = normalize_care_status(payload.status, default=CARE_STATUS_ACTIVE)
        staff_kind = normalize_staff_kind(payload.staff_kind)
        slugs = normalize_companion_service_slugs(
            payload.companion_service_slugs,
            required=is_service_companion_kind(staff_kind),
        )
        create_payload = CareManagerCreate(
            user_id=user.id,
            employee_id=payload.employee_id,
            first_name=payload.first_name,
            last_name=payload.last_name,
            skills=payload.skills,
            experience=payload.experience,
            languages=payload.languages,
            availability=payload.availability,
            status=status_value,
            staff_kind=staff_kind,
            companion_service_slugs=slugs if is_service_companion_kind(staff_kind) else [],
        )
        return await self.create_care_manager(create_payload)

    def _assignment_fields(self, staff_kind: str) -> tuple[str, str]:
        kind = (staff_kind or CARE_STAFF_KIND_CARE_MANAGER).upper()
        if kind == CARE_STAFF_KIND_COMPANION:
            return "companion_id", "companion_primary_id"
        if kind == CARE_STAFF_KIND_CARE_MANAGER:
            return "care_manager_id", "care_manager_primary_id"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Caseload transfer is only supported for Care Managers and Companions.",
        )

    async def preview_caseload(self, care_manager_id: UUID, *, actor=None) -> CaseloadPreviewResponse:
        row = await self.repo.get_by_id(care_manager_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Care manager not found")
        await self._ensure_care_visible(row, actor)
        kind = (row.staff_kind or CARE_STAFF_KIND_CARE_MANAGER).upper()
        transfer_supported = kind in (CARE_STAFF_KIND_CARE_MANAGER, CARE_STAFF_KIND_COMPANION)
        standing = await self.repo.list_standing_seniors(care_manager_id, staff_kind=kind) if transfer_supported else []
        covered = await self.repo.list_covered_seniors(care_manager_id, staff_kind=kind) if transfer_supported else []
        open_visits = await self.repo.count_open_visits(care_manager_id)
        return CaseloadPreviewResponse(
            staff_id=row.id,
            staff_kind=kind,
            status=row.status,
            standing_senior_count=len(standing),
            covered_senior_count=len(covered),
            open_visit_count=open_visits,
            can_restore=len(covered) > 0,
            transfer_supported=transfer_supported,
        )

    async def transfer_caseload(
        self,
        care_manager_id: UUID,
        payload: CaseloadTransferRequest,
        *,
        actor=None,
    ) -> CaseloadTransferResponse:
        source = await self.repo.get_by_id(care_manager_id)
        if not source:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Care manager not found")
        await self._ensure_care_visible(source, actor)

        if payload.substitute_id == care_manager_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Choose a different staff member as the substitute.",
            )

        substitute = await self.repo.get_by_id(payload.substitute_id)
        if not substitute:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Substitute not found")
        await self._ensure_care_visible(substitute, actor)

        source_kind = (source.staff_kind or CARE_STAFF_KIND_CARE_MANAGER).upper()
        substitute_kind = (substitute.staff_kind or CARE_STAFF_KIND_CARE_MANAGER).upper()
        assignment_field, primary_field = self._assignment_fields(source_kind)
        if substitute_kind != source_kind:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Substitute must have the same role (Care Manager or Companion).",
            )
        if (substitute.status or "").upper() != CARE_STATUS_ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Substitute must be ACTIVE.",
            )

        seniors = await self.repo.list_standing_seniors(care_manager_id, staff_kind=source_kind)
        senior_ids = [senior.id for senior in seniors]
        mode = payload.mode.upper()
        for senior in seniors:
            if mode == "TEMPORARY":
                if getattr(senior, primary_field) is None:
                    setattr(senior, primary_field, care_manager_id)
            else:
                if getattr(senior, primary_field) == care_manager_id:
                    setattr(senior, primary_field, None)
            setattr(senior, assignment_field, payload.substitute_id)

        visits_moved = 0
        if payload.transfer_visits and senior_ids:
            visits_moved = await self.repo.reassign_open_visits(
                from_staff_id=care_manager_id,
                to_staff_id=payload.substitute_id,
            )

        if mode == "TEMPORARY":
            source.status = CARE_STATUS_ON_LEAVE

        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="care_managers",
                entity_id=str(care_manager_id),
                action="TRANSFER_CASELOAD",
                changes=json.dumps(
                    {
                        "mode": mode,
                        "substitute_id": str(payload.substitute_id),
                        "seniors_moved": len(senior_ids),
                        "visits_moved": visits_moved,
                        "staff_kind": source_kind,
                    }
                ),
            )
        await self.repo.session.commit()
        return CaseloadTransferResponse(
            from_staff_id=care_manager_id,
            to_staff_id=payload.substitute_id,
            mode=mode,
            staff_kind=source_kind,
            seniors_moved=len(senior_ids),
            visits_moved=visits_moved,
            senior_ids=senior_ids,
        )

    async def restore_caseload(self, care_manager_id: UUID, *, actor=None) -> CaseloadRestoreResponse:
        source = await self.repo.get_by_id(care_manager_id)
        if not source:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Care manager not found")
        await self._ensure_care_visible(source, actor)

        source_kind = (source.staff_kind or CARE_STAFF_KIND_CARE_MANAGER).upper()
        assignment_field, primary_field = self._assignment_fields(source_kind)
        seniors = await self.repo.list_covered_seniors(care_manager_id, staff_kind=source_kind)
        if not seniors:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No temporary coverage found to restore for this staff member.",
            )

        senior_ids = [senior.id for senior in seniors]
        visits_moved = 0
        for senior in seniors:
            current_assignee = getattr(senior, assignment_field)
            if current_assignee and current_assignee != care_manager_id:
                visits_moved += await self.repo.reassign_open_visits(
                    from_staff_id=current_assignee,
                    to_staff_id=care_manager_id,
                    senior_ids=[senior.id],
                )
            setattr(senior, assignment_field, care_manager_id)
            setattr(senior, primary_field, None)

        source.status = CARE_STATUS_ACTIVE

        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="care_managers",
                entity_id=str(care_manager_id),
                action="RESTORE_CASELOAD",
                changes=json.dumps(
                    {
                        "seniors_restored": len(senior_ids),
                        "visits_moved": visits_moved,
                        "staff_kind": source_kind,
                    }
                ),
            )
        await self.repo.session.commit()
        return CaseloadRestoreResponse(
            staff_id=care_manager_id,
            staff_kind=source_kind,
            seniors_restored=len(senior_ids),
            visits_moved=visits_moved,
            senior_ids=senior_ids,
        )

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
