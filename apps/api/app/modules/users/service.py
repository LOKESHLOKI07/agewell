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
    from app.modules.users.models import AccountStatus

    return UserResponse(
        id=user.id,
        email=user.email,
        phone=user.phone,
        role=user.role,
        account_status=user.account_status or AccountStatus.ACTIVE,
        service_city=getattr(user, "service_city", None),
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


class UserService:
    def __init__(self, repo: UserRepository, audit_repo: Optional[AuditRepository] = None):
        self.repo = repo
        self.audit_repo = audit_repo

    def _resolved_create_city(self, user_in: UserCreate, actor: Optional[User]) -> Optional[str]:
        from app.modules.cities.catalog import is_super_staff, normalize_city, staff_city

        requested = normalize_city(user_in.service_city)
        if actor is None:
            if user_in.role == RoleEnum.ADMIN:
                return normalize_city(requested, required=True)
            return requested
        actor_city = staff_city(actor)
        if not is_super_staff(actor):
            if user_in.role in (RoleEnum.ADMIN, RoleEnum.OPERATIONS):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only a super admin can create city admins.",
                )
            return actor_city
        if user_in.role == RoleEnum.ADMIN:
            return normalize_city(requested, required=True)
        return requested

    async def create_user(self, user_in: UserCreate, *, actor: Optional[User] = None):
        from app.modules.users.models import AccountStatus

        if await self.repo.get_by_email(user_in.email):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
        if await self.repo.get_by_phone(user_in.phone):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone already exists")
        hashed = get_password_hash(user_in.password)
        created = UserCreate(
            email=user_in.email.strip().lower(),
            phone=user_in.phone.strip(),
            role=user_in.role,
            password=hashed,
            account_status=user_in.account_status or AccountStatus.ACTIVE,
            service_city=self._resolved_create_city(user_in, actor),
        )
        user = await self.repo.create(created)
        from app.modules.notifications.preferences import ensure_notification_preferences

        # repo.create already commits the user; persist default notification flags next.
        await ensure_notification_preferences(self.repo.session, user.id)
        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="users",
                entity_id=str(user.id),
                action="CREATE",
                changes=json.dumps({"email": user.email, "role": user.role.value}),
            )
        await self.repo.session.commit()
        return to_user_response(user)

    async def get_user(self, user_id, *, actor: Optional[User] = None):
        from app.modules.cities.catalog import ensure_staff_can_see_user

        user = await self.repo.get_by_id(user_id)
        if actor is not None:
            ensure_staff_can_see_user(actor, user)
        return to_user_response(user) if user else None

    async def list_users(
        self,
        *,
        role: Optional[RoleEnum] = None,
        email: Optional[str] = None,
        service_city: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> ListPage[UserResponse]:
        rows, total = await self.repo.list_users(
            role=role, email=email, service_city=service_city, limit=limit, offset=offset
        )
        return ListPage(
            items=[to_user_response(row) for row in rows],
            total=total,
            limit=limit,
            offset=offset,
        )

    async def update_user(self, user_id: UUID, payload: UserUpdate, *, actor: Optional[User] = None) -> UserResponse:
        from app.modules.cities.catalog import ensure_staff_can_see_user, is_super_staff, normalize_city

        user = await self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        if actor is not None:
            ensure_staff_can_see_user(actor, user)
        data = payload.model_dump(exclude_unset=True)
        if "service_city" in data:
            if actor is not None and not is_super_staff(actor):
                data.pop("service_city")
            else:
                data["service_city"] = normalize_city(data.get("service_city"))
        if "role" in data and data["role"] != user.role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role changes are disabled to protect linked profiles. Create a new user account instead.",
            )
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

    async def delete_user(self, user_id: UUID, *, actor_user_id: UUID, actor: Optional[User] = None) -> UserResponse:
        from app.modules.cities.catalog import ensure_staff_can_see_user
        from app.modules.people.deletion import commit_people_delete, delete_user_record

        user = await self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        if actor is not None:
            ensure_staff_can_see_user(actor, user)
        response = to_user_response(user)
        await delete_user_record(self.repo.session, user_id, also_profile=True, actor_user_id=actor_user_id)
        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="users",
                entity_id=str(user_id),
                action="DELETE",
                changes=json.dumps({"email": response.email, "role": response.role.value}),
            )
        await commit_people_delete(self.repo.session)
        return response
