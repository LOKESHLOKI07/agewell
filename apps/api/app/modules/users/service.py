import json
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status

from app.api.schemas import ListPage
from app.core.security import get_password_hash
from app.modules.audit.repository import AuditRepository
from app.modules.users.models import RoleEnum, User
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreate, UserResponse, UserUpdate


def to_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        phone=user.phone,
        role=user.role,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


class UserService:
    def __init__(self, repo: UserRepository, audit_repo: Optional[AuditRepository] = None):
        self.repo = repo
        self.audit_repo = audit_repo

    async def create_user(self, user_in: UserCreate):
        if await self.repo.get_by_email(user_in.email):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
        if await self.repo.get_by_phone(user_in.phone):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone already exists")
        hashed = get_password_hash(user_in.password)
        created = UserCreate(email=user_in.email, phone=user_in.phone, role=user_in.role, password=hashed)
        user = await self.repo.create(created)
        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="users",
                entity_id=str(user.id),
                action="CREATE",
                changes=json.dumps({"email": user.email, "role": user.role.value}),
            )
            await self.repo.session.commit()
        return to_user_response(user)

    async def get_user(self, user_id):
        user = await self.repo.get_by_id(user_id)
        return to_user_response(user) if user else None

    async def list_users(
        self,
        *,
        role: Optional[RoleEnum] = None,
        email: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> ListPage[UserResponse]:
        rows, total = await self.repo.list_users(role=role, email=email, limit=limit, offset=offset)
        return ListPage(
            items=[to_user_response(row) for row in rows],
            total=total,
            limit=limit,
            offset=offset,
        )

    async def update_user(self, user_id: UUID, payload: UserUpdate) -> UserResponse:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        data = payload.model_dump(exclude_unset=True)
        if "email" in data and data["email"] != user.email:
            existing = await self.repo.get_by_email(data["email"])
            if existing and existing.id != user.id:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
        if "phone" in data and data["phone"] != user.phone:
            existing = await self.repo.get_by_phone(data["phone"])
            if existing and existing.id != user.id:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone already exists")
        for field, value in data.items():
            setattr(user, field, value)
        user = await self.repo.save(user)
        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="users",
                entity_id=str(user.id),
                action="UPDATE",
                changes=json.dumps({key: str(value) for key, value in data.items()}),
            )
            await self.repo.session.commit()
        return to_user_response(user)
