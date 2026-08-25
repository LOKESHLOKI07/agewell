from fastapi import HTTPException, status

from app.api.schemas import ListPage
from app.modules.access.service import FORBIDDEN
from app.modules.families.repository import FamilyRepository
from app.modules.families.schemas import FamilyMemberResponse
from app.modules.seniors.schemas import SeniorResponse
from app.modules.users.models import RoleEnum, User


class FamilyService:
    def __init__(self, repo: FamilyRepository):
        self.repo = repo

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

    async def _require_family_member(self, user: User):
        if user.role != RoleEnum.FAMILY:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=FORBIDDEN)
        family = await self.repo.get_by_user_id(user.id)
        if not family:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family profile not found")
        return family
