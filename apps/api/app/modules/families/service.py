import json
from uuid import UUID

from fastapi import HTTPException, status

from app.api.schemas import ListPage
from app.modules.access.service import FORBIDDEN
from app.modules.audit.repository import AuditRepository
from app.modules.families.repository import FamilyRepository
from app.modules.families.schemas import FamilyMemberCreate, FamilyMemberResponse, FamilyMemberUpdate
from app.modules.seniors.schemas import SeniorResponse
from app.modules.users.models import RoleEnum, User
from app.modules.users.repository import UserRepository


class FamilyService:
    def __init__(
        self,
        repo: FamilyRepository,
        user_repo: UserRepository | None = None,
        audit_repo: AuditRepository | None = None,
    ):
        self.repo = repo
        self.user_repo = user_repo
        self.audit_repo = audit_repo

    async def get_me(self, user: User) -> FamilyMemberResponse:
        family = await self._require_family_member(user)
        if family.user_id is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Family profile is missing user_id")
        return FamilyMemberResponse.model_validate(family)

    async def list_authorized_seniors(self, user: User) -> list[SeniorResponse]:
        family = await self._require_family_member(user)
        seniors = await self.repo.list_authorized_seniors(family.id)
        return [SeniorResponse.model_validate(senior) for senior in seniors]

    async def list_families(self, *, limit: int = 50, offset: int = 0) -> ListPage[FamilyMemberResponse]:
        rows, total = await self.repo.list_families(limit=limit, offset=offset)
        return ListPage(
            items=[FamilyMemberResponse.model_validate(row) for row in rows],
            total=total,
            limit=limit,
            offset=offset,
        )

    async def get_family_by_user_id(self, user_id: UUID) -> FamilyMemberResponse:
        row = await self.repo.get_by_user_id(user_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family member not found")
        return FamilyMemberResponse.model_validate(row)

    async def get_family(self, family_id: UUID) -> FamilyMemberResponse:
        row = await self.repo.get_by_id(family_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family member not found")
        return FamilyMemberResponse.model_validate(row)

    async def create_family(self, payload: FamilyMemberCreate) -> FamilyMemberResponse:
        if not self.user_repo:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="User repository missing")
        user = await self.user_repo.get_by_id(payload.user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        if user.role != RoleEnum.FAMILY:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User must have FAMILY role")
        if await self.repo.get_by_user_id(payload.user_id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Family profile already exists for this user",
            )
        row = await self.repo.create(
            user_id=payload.user_id,
            first_name=payload.first_name.strip(),
            last_name=payload.last_name.strip(),
            relationship=(payload.relationship or "").strip() or None,
            requested_senior_reference=(payload.requested_senior_reference or "").strip() or None,
            date_of_birth=payload.date_of_birth,
            address=(payload.address or "").strip() or None,
            preferred_language=(payload.preferred_language or "").strip() or None,
        )
        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="family_members",
                entity_id=str(row.id),
                action="CREATE",
                changes=json.dumps({"user_id": str(payload.user_id)}),
            )
            await self.repo.session.commit()
        return FamilyMemberResponse.model_validate(row)

    async def update_family(self, family_id: UUID, payload: FamilyMemberUpdate) -> FamilyMemberResponse:
        row = await self.repo.get_by_id(family_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family member not found")
        data = payload.model_dump(exclude_unset=True)
        row = await self.repo.update(row, data)
        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="family_members",
                entity_id=str(row.id),
                action="UPDATE",
                changes=json.dumps(payload.model_dump(exclude_unset=True, mode="json")),
            )
            await self.repo.session.commit()
        return FamilyMemberResponse.model_validate(row)

    async def delete_family(self, family_id: UUID) -> FamilyMemberResponse:
        from app.modules.people.deletion import commit_people_delete, delete_family_record

        row = await self.repo.get_by_id(family_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family member not found")
        response = FamilyMemberResponse.model_validate(row)
        await delete_family_record(self.repo.session, family_id, also_user=True)
        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="family_members",
                entity_id=str(family_id),
                action="DELETE",
                changes=json.dumps({"user_id": str(response.user_id)}),
            )
        await commit_people_delete(self.repo.session)
        return response

    async def _require_family_member(self, user: User):
        if user.role != RoleEnum.FAMILY:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
        family = await self.repo.get_by_user_id(user.id)
        if not family:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family profile not found")
        return family
