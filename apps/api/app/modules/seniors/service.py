import json

from fastapi import HTTPException, status

from app.api.schemas import ListPage
from app.modules.audit.repository import AuditRepository
from app.modules.seniors.repository import SeniorRepository
from app.modules.seniors.schemas import SeniorCreate, SeniorDirectoryItem, SeniorResponse
from app.modules.users.repository import UserRepository


class SeniorService:
    def __init__(
        self,
        repo: SeniorRepository,
        user_repo: UserRepository | None = None,
        audit_repo: AuditRepository | None = None,
    ):
        self.repo = repo
        self.user_repo = user_repo
        self.audit_repo = audit_repo

    async def create_senior(self, senior_in: SeniorCreate):
        if self.user_repo:
            user = await self.user_repo.get_by_id(senior_in.user_id)
            if not user:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        existing = await self.repo.get_by_user_id(senior_in.user_id)
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Senior profile already exists for this user")
        senior = await self.repo.create(senior_in)
        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="seniors",
                entity_id=str(senior.id),
                action="CREATE",
                changes=json.dumps({"user_id": str(senior.user_id), "first_name": senior.first_name}),
            )
            await self.repo.session.commit()
        return senior

    async def get_senior(self, senior_id):
        return await self.repo.get_by_id(senior_id)

    async def get_by_user_id(self, user_id):
        return await self.repo.get_by_user_id(user_id)

    async def list_seniors(self, *, limit: int = 50, offset: int = 0) -> ListPage[SeniorDirectoryItem]:
        rows, total = await self.repo.list_seniors(limit=limit, offset=offset)
        items = [
            SeniorDirectoryItem(
                id=senior.id,
                user_id=senior.user_id,
                first_name=senior.first_name,
                last_name=senior.last_name,
                date_of_birth=senior.date_of_birth,
                address=senior.address,
                emergency_contact=senior.emergency_contact,
                email=email,
            )
            for senior, email in rows
        ]
        return ListPage(items=items, total=total, limit=limit, offset=offset)
