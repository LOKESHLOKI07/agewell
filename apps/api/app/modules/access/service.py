from dataclasses import dataclass
from typing import Optional
from uuid import UUID
import json

from fastapi import HTTPException, status

from app.api.schemas import ListPage
from app.modules.access.repository import AccessRepository
from app.modules.access.schemas import FamilySeniorAccessResponse
from app.modules.seniors.repository import SeniorRepository
from app.modules.users.models import RoleEnum, User

FORBIDDEN = "You don't have permission to access this information."


def as_uuid(value) -> Optional[UUID]:
    if value is None:
        return None
    if isinstance(value, UUID):
        return value
    try:
        return UUID(str(value))
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Senior not found")


@dataclass(frozen=True)
class VisitListScope:
    senior_id: Optional[UUID] = None
    care_manager_id: Optional[UUID] = None


@dataclass(frozen=True)
class EmergencyListScope:
    """senior_id scopes one senior; assigned_senior_ids scopes a care manager's visit seniors.

    Both None means ADMIN/OPERATIONS may query all cases.
    """

    senior_id: Optional[UUID] = None
    assigned_senior_ids: Optional[tuple] = None


class AccessService:
    def __init__(self, access_repo: AccessRepository, senior_repo: SeniorRepository):
        self.access_repo = access_repo
        self.senior_repo = senior_repo

    async def get_senior_for_user(self, user: User):
        if user.role != RoleEnum.SENIOR:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
        senior = await self.senior_repo.get_by_user_id(user.id)
        if not senior:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Senior profile not found")
        return senior

    async def resolve_senior_id(
        self,
        user: User,
        requested_senior_id: Optional[UUID] = None,
        *,
        allow_unscoped_staff: bool = False,
    ) -> Optional[UUID]:
        """
        Returns the senior_id the caller may query.
        None means staff may query all seniors (list endpoints only).

        CARE_MANAGER is not resolved here. Care associates may only reach a
        senior through an assigned visit — see resolve_visit_list_scope and
        ensure_visit_access.
        """
        requested_senior_id = as_uuid(requested_senior_id)

        if user.role == RoleEnum.SENIOR:
            senior = await self.senior_repo.get_by_user_id(user.id)
            if not senior:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Senior profile not found")
            if requested_senior_id and requested_senior_id != senior.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
            return senior.id

        if user.role in (RoleEnum.ADMIN, RoleEnum.OPERATIONS):
            if requested_senior_id:
                senior = await self.senior_repo.get_by_id(requested_senior_id)
                if not senior:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Senior not found")
                return requested_senior_id
            if allow_unscoped_staff:
                return None
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="senior_id is required",
            )

        if user.role == RoleEnum.FAMILY:
            family = await self.access_repo.get_family_member_by_user_id(user.id)
            if not family or not requested_senior_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
            allowed = await self.access_repo.has_family_senior_access(family.id, requested_senior_id)
            if not allowed:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
            return requested_senior_id

        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)

    async def resolve_visit_list_scope(
        self,
        user: User,
        requested_senior_id: Optional[UUID] = None,
        *,
        allow_unscoped_staff: bool = True,
    ) -> VisitListScope:
        """
        CARE_MANAGER → assigned visits only.
        A requested senior_id is allowed only when this care manager already
        has an assigned visit for that senior. Arbitrary seniors remain 403.
        """
        if user.role == RoleEnum.CARE_MANAGER:
            care_manager = await self.access_repo.get_care_manager_by_user_id(user.id)
            if not care_manager:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
            requested = as_uuid(requested_senior_id)
            if requested:
                assigned = await self.access_repo.care_manager_has_assigned_visit_for_senior(
                    care_manager.id, requested
                )
                if not assigned:
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
                return VisitListScope(senior_id=requested, care_manager_id=care_manager.id)
            return VisitListScope(senior_id=None, care_manager_id=care_manager.id)

        senior_id = await self.resolve_senior_id(
            user, requested_senior_id, allow_unscoped_staff=allow_unscoped_staff
        )
        return VisitListScope(senior_id=senior_id, care_manager_id=None)

    async def ensure_visit_access(self, user: User, visit) -> None:
        if user.role == RoleEnum.SENIOR:
            senior = await self.senior_repo.get_by_user_id(user.id)
            if not senior or visit.senior_id != senior.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
            return

        if user.role == RoleEnum.FAMILY:
            family = await self.access_repo.get_family_member_by_user_id(user.id)
            if not family:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
            allowed = await self.access_repo.has_family_senior_access(family.id, visit.senior_id)
            if not allowed:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
            return

        if user.role == RoleEnum.CARE_MANAGER:
            care_manager = await self.access_repo.get_care_manager_by_user_id(user.id)
            if not care_manager or visit.care_manager_id != care_manager.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
            return

        if user.role in (RoleEnum.ADMIN, RoleEnum.OPERATIONS):
            return

        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)

    async def resolve_emergency_list_scope(
        self,
        user: User,
        requested_senior_id: Optional[UUID] = None,
    ) -> EmergencyListScope:
        """List scope for emergency cases. CARE_MANAGER is limited to visit-assigned seniors."""
        if user.role == RoleEnum.CARE_MANAGER:
            care_manager = await self.access_repo.get_care_manager_by_user_id(user.id)
            if not care_manager:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
            requested = as_uuid(requested_senior_id)
            if requested:
                assigned = await self.access_repo.care_manager_has_assigned_visit_for_senior(
                    care_manager.id, requested
                )
                if not assigned:
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
                return EmergencyListScope(senior_id=requested)
            senior_ids = await self.access_repo.list_assigned_senior_ids(care_manager.id)
            return EmergencyListScope(assigned_senior_ids=tuple(senior_ids))

        senior_id = await self.resolve_senior_id(
            user, requested_senior_id, allow_unscoped_staff=True
        )
        return EmergencyListScope(senior_id=senior_id)

    async def resolve_emergency_senior_id(self, user: User, requested_senior_id: Optional[UUID] = None) -> UUID:
        """Create/mutate: a concrete senior_id is always required after resolution."""
        if user.role == RoleEnum.CARE_MANAGER:
            requested = as_uuid(requested_senior_id)
            if not requested:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
            scope = await self.resolve_emergency_list_scope(user, requested)
            if not scope.senior_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
            return scope.senior_id

        senior_id = await self.resolve_senior_id(
            user, requested_senior_id, allow_unscoped_staff=False
        )
        if senior_id is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
        return senior_id

    async def ensure_emergency_access(self, user: User, senior_id: Optional[UUID]) -> None:
        if user.role in (RoleEnum.ADMIN, RoleEnum.OPERATIONS):
            return
        if senior_id is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
        await self.resolve_emergency_senior_id(user, senior_id)


class FamilyAccessAdminService:
    def __init__(self, access_repo: AccessRepository, senior_repo: SeniorRepository, family_repo, audit_repo=None):
        self.access_repo = access_repo
        self.senior_repo = senior_repo
        self.family_repo = family_repo
        self.audit_repo = audit_repo

    async def list_access(self, *, family_id=None, senior_id=None, limit: int = 50, offset: int = 0):
        rows, total = await self.access_repo.list_access(
            family_id=family_id, senior_id=senior_id, limit=limit, offset=offset
        )
        return ListPage(
            items=[FamilySeniorAccessResponse.model_validate(row) for row in rows],
            total=total,
            limit=limit,
            offset=offset,
        )

    async def create_access(self, family_id, senior_id):
        family = await self.family_repo.get_by_id(family_id)
        if family is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family member not found")
        senior = await self.senior_repo.get_by_id(senior_id)
        if not senior:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Senior not found")
        if await self.access_repo.has_family_senior_access(family_id, senior_id):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Access relationship already exists")
        row = await self.access_repo.create_access(family_id=family_id, senior_id=senior_id)
        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="family_senior_access",
                entity_id=str(row.id),
                action="CREATE",
                changes=json.dumps({"family_id": str(family_id), "senior_id": str(senior_id)}),
            )
            await self.access_repo.session.commit()
        return FamilySeniorAccessResponse.model_validate(row)

    async def delete_access(self, access_id):
        row = await self.access_repo.get_access_by_id(access_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Access relationship not found")
        response = FamilySeniorAccessResponse.model_validate(row)
        payload = {"family_id": str(row.family_id), "senior_id": str(row.senior_id)}
        await self.access_repo.delete_access(row)
        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="family_senior_access",
                entity_id=str(response.id),
                action="DELETE",
                changes=json.dumps(payload),
            )
            await self.access_repo.session.commit()
        return response

