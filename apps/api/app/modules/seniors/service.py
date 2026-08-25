import json
from typing import Optional

from fastapi import HTTPException, status

from app.api.schemas import ListPage
from app.modules.audit.repository import AuditRepository
from app.modules.seniors.repository import SeniorRepository
from app.modules.seniors.schemas import SeniorCreate, SeniorDirectoryItem, SeniorUpdate
from app.modules.users.models import AccountStatus
from app.modules.users.repository import UserRepository


def _account_status_value(value) -> Optional[str]:
    if value is None:
        return None
    return value.value if hasattr(value, "value") else str(value)


def to_senior_directory_item(senior, email=None, phone=None, account_status=None) -> SeniorDirectoryItem:
    return SeniorDirectoryItem(
        id=senior.id,
        user_id=senior.user_id,
        first_name=senior.first_name,
        last_name=senior.last_name,
        date_of_birth=senior.date_of_birth,
        address=senior.address,
        emergency_contact=senior.emergency_contact,
        email=email,
        phone=phone,
        account_status=_account_status_value(account_status) or AccountStatus.ACTIVE.value,
    )


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
        return await self.get_senior_detail(senior.id)

    async def get_senior(self, senior_id):
        return await self.repo.get_by_id(senior_id)

    async def get_senior_detail(self, senior_id) -> SeniorDirectoryItem:
        row = await self.repo.get_with_user(senior_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Senior not found")
        senior, user = row
        return to_senior_directory_item(
            senior,
            email=user.email if user else None,
            phone=user.phone if user else None,
            account_status=user.account_status if user else None,
        )

    async def get_by_user_id(self, user_id):
        return await self.repo.get_by_user_id(user_id)

    async def get_senior_detail_by_user_id(self, user_id) -> SeniorDirectoryItem:
        senior = await self.repo.get_by_user_id(user_id)
        if not senior:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Senior not found")
        return await self.get_senior_detail(senior.id)

    async def update_senior(self, senior_id, payload: SeniorUpdate) -> SeniorDirectoryItem:
        row = await self.repo.get_with_user(senior_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Senior not found")
        senior, user = row
        data = payload.model_dump(exclude_unset=True)
        email = data.pop("email", None)
        phone = data.pop("phone", None)
        profile_changes = {}
        for field, value in data.items():
            if isinstance(value, str):
                value = value.strip()
            profile_changes[field] = value
        if profile_changes:
            senior = await self.repo.update(senior, profile_changes)

        user_changes = {}
        if email is not None and self.user_repo and user:
            normalized = email.strip().lower()
            if normalized != user.email:
                existing = await self.user_repo.get_by_email(normalized)
                if existing and existing.id != user.id:
                    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
                user.email = normalized
                user_changes["email"] = normalized
        if phone is not None and self.user_repo and user:
            normalized_phone = phone.strip()
            if normalized_phone != user.phone:
                existing = await self.user_repo.get_by_phone(normalized_phone)
                if existing and existing.id != user.id:
                    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone already exists")
                user.phone = normalized_phone
                user_changes["phone"] = normalized_phone
        if user_changes and self.user_repo and user:
            await self.user_repo.save(user)

        if self.audit_repo and (profile_changes or user_changes):
            await self.audit_repo.record(
                entity_name="seniors",
                entity_id=str(senior.id),
                action="UPDATE",
                changes=json.dumps({**profile_changes, **user_changes}),
            )
            await self.repo.session.commit()

        return await self.get_senior_detail(senior.id)

    async def delete_senior(self, senior_id) -> SeniorDirectoryItem:
        from app.modules.people.deletion import commit_people_delete, delete_senior_record

        detail = await self.get_senior_detail(senior_id)
        await delete_senior_record(self.repo.session, senior_id, also_user=True)
        if self.audit_repo:
            await self.audit_repo.record(
                entity_name="seniors",
                entity_id=str(detail.id),
                action="DELETE",
                changes=json.dumps({"user_id": str(detail.user_id), "first_name": detail.first_name}),
            )
        await commit_people_delete(self.repo.session)
        return detail

    async def list_seniors(self, *, limit: int = 50, offset: int = 0) -> ListPage[SeniorDirectoryItem]:
        rows, total = await self.repo.list_seniors(limit=limit, offset=offset)
        items = [
            to_senior_directory_item(senior, email=email, phone=phone, account_status=account_status)
            for senior, email, phone, account_status in rows
        ]
        return ListPage(items=items, total=total, limit=limit, offset=offset)
