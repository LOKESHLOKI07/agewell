import json
from datetime import date, datetime
from typing import Any, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select

from app.api.schemas import ListPage
from app.modules.audit.repository import AuditRepository
from app.modules.seniors.repository import SeniorRepository
from app.modules.seniors.service_area import resolve_in_service_area
from app.modules.seniors.schemas import (
    SeniorCreate,
    SeniorDirectoryItem,
    SeniorResponse,
    SeniorUpdate,
    normalize_profile_photo,
)
from app.modules.users.models import AccountStatus
from app.modules.users.repository import UserRepository


def _account_status_value(value) -> Optional[str]:
    if value is None:
        return None
    return value.value if hasattr(value, "value") else str(value)


def to_senior_response(senior) -> SeniorResponse:
    return SeniorResponse(
        id=senior.id,
        user_id=senior.user_id,
        first_name=senior.first_name,
        last_name=senior.last_name,
        date_of_birth=senior.date_of_birth,
        address=senior.address,
        emergency_contact=senior.emergency_contact,
        preferred_language=senior.preferred_language,
        family_contact_1_name=getattr(senior, "family_contact_1_name", None),
        family_contact_1_phone=getattr(senior, "family_contact_1_phone", None),
        family_contact_2_name=getattr(senior, "family_contact_2_name", None),
        family_contact_2_phone=getattr(senior, "family_contact_2_phone", None),
        preferred_hospital=getattr(senior, "preferred_hospital", None),
        photo=senior.photo,
        in_service_area=resolve_in_service_area(senior),
        care_manager_id=getattr(senior, "care_manager_id", None),
        location_lat=getattr(senior, "location_lat", None),
        location_lng=getattr(senior, "location_lng", None),
        location_query=getattr(senior, "location_query", None),
        location_source=getattr(senior, "location_source", None),
    )


def to_senior_directory_item(
    senior,
    email=None,
    phone=None,
    account_status=None,
    *,
    has_membership: bool = False,
) -> SeniorDirectoryItem:
    return SeniorDirectoryItem(
        id=senior.id,
        user_id=senior.user_id,
        first_name=senior.first_name,
        last_name=senior.last_name,
        date_of_birth=senior.date_of_birth,
        address=senior.address,
        emergency_contact=senior.emergency_contact,
        preferred_language=senior.preferred_language,
        family_contact_1_name=getattr(senior, "family_contact_1_name", None),
        family_contact_1_phone=getattr(senior, "family_contact_1_phone", None),
        family_contact_2_name=getattr(senior, "family_contact_2_name", None),
        family_contact_2_phone=getattr(senior, "family_contact_2_phone", None),
        preferred_hospital=getattr(senior, "preferred_hospital", None),
        email=email,
        phone=phone,
        account_status=_account_status_value(account_status) or AccountStatus.ACTIVE.value,
        photo=None,
        in_service_area=resolve_in_service_area(senior),
        care_manager_id=getattr(senior, "care_manager_id", None),
        location_lat=getattr(senior, "location_lat", None),
        location_lng=getattr(senior, "location_lng", None),
        location_query=getattr(senior, "location_query", None),
        location_source=getattr(senior, "location_source", None),
        has_membership=bool(has_membership),
    )


def _json_safe(value: Any) -> Any:
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    if isinstance(value, UUID):
        return str(value)
    return value


def _audit_profile_changes(changes: dict) -> dict:
    audited = {key: _json_safe(value) for key, value in changes.items()}
    if "photo" in audited:
        audited["photo"] = "cleared" if not audited["photo"] else "updated"
    return audited


def _validated_photo(value: Optional[str]) -> Optional[str]:
    try:
        return normalize_profile_photo(value)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


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
        has_membership = await self.repo.senior_has_membership(senior.id)
        return to_senior_directory_item(
            senior,
            email=user.email if user else None,
            phone=user.phone if user else None,
            account_status=user.account_status if user else None,
            has_membership=has_membership,
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
        if "care_manager_id" in data:
            assigned_id = data["care_manager_id"]
            if assigned_id is not None:
                from app.modules.care.models import CARE_STAFF_KIND_CARE_MANAGER, CareManager

                care = (
                    await self.repo.session.execute(select(CareManager).where(CareManager.id == assigned_id))
                ).scalars().first()
                if not care:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Care manager not found")
                kind = (care.staff_kind or CARE_STAFF_KIND_CARE_MANAGER).upper()
                if kind != CARE_STAFF_KIND_CARE_MANAGER:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Assigned staff must be a Care Manager",
                    )
        if "photo" in data:
            data["photo"] = _validated_photo(data["photo"])
        profile_changes = {}
        for field, value in data.items():
            if isinstance(value, str) and field != "photo":
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
                changes=json.dumps({**_audit_profile_changes(profile_changes), **user_changes}),
            )
            await self.repo.session.commit()

        return await self.get_senior_detail(senior.id)

    async def update_me(
        self,
        senior,
        *,
        set_photo: bool = False,
        photo: Optional[str] = None,
        set_in_service_area: bool = False,
        in_service_area: Optional[bool] = None,
        set_location: bool = False,
        location_lat: Optional[float] = None,
        location_lng: Optional[float] = None,
        location_query: Optional[str] = None,
        location_source: Optional[str] = None,
    ) -> SeniorResponse:
        data: dict = {}
        if set_photo:
            data["photo"] = _validated_photo(photo)
        if set_in_service_area:
            data["in_service_area"] = None if in_service_area is None else bool(in_service_area)
        if set_location:
            source = (location_source or "").strip().lower() or None
            if source and source not in ("gps", "manual"):
                source = None
            data["location_source"] = source
            if source == "gps":
                data["location_lat"] = location_lat
                data["location_lng"] = location_lng
                data["location_query"] = None
            elif source == "manual":
                data["location_lat"] = None
                data["location_lng"] = None
                data["location_query"] = (location_query or "").strip() or None
            else:
                data["location_lat"] = location_lat
                data["location_lng"] = location_lng
                data["location_query"] = (location_query or "").strip() or None
        if not data:
            return to_senior_response(senior)
        senior = await self.repo.update(senior, data)
        if self.audit_repo:
            audited: dict = {}
            if "photo" in data:
                audited["photo"] = "cleared" if not data["photo"] else "updated"
            if "in_service_area" in data:
                audited["in_service_area"] = data["in_service_area"]
            for key in ("location_lat", "location_lng", "location_query", "location_source"):
                if key in data:
                    audited[key] = data[key]
            await self.audit_repo.record(
                entity_name="seniors",
                entity_id=str(senior.id),
                action="UPDATE",
                changes=json.dumps(audited),
            )
            await self.repo.session.commit()
        return to_senior_response(senior)

    async def update_photo(self, senior, photo: Optional[str]) -> SeniorResponse:
        return await self.update_me(senior, set_photo=True, photo=photo)

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

    async def list_seniors(
        self, *, limit: int = 50, offset: int = 0, segment: str | None = None
    ) -> ListPage[SeniorDirectoryItem]:
        rows, total = await self.repo.list_seniors(limit=limit, offset=offset, segment=segment)
        items = [
            to_senior_directory_item(
                senior,
                email=email,
                phone=phone,
                account_status=account_status,
                has_membership=bool(has_membership),
            )
            for senior, email, phone, account_status, has_membership in rows
        ]
        return ListPage(items=items, total=total, limit=limit, offset=offset)
