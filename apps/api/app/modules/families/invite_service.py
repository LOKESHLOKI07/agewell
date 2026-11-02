from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.modules.access.models import FamilySeniorAccess
from app.modules.auth.mailer import send_family_welcome_email, smtp_configured
from app.modules.families.invite_models import FamilyInvite, FamilyInviteStatus
from app.modules.families.invite_schemas import (
    FamilyCircleMember,
    FamilyCircleResponse,
    FamilyInviteCreate,
    FamilyInviteResponse,
)
from app.modules.families.models import FamilyMember
from app.modules.seniors.models import Senior
from app.modules.users.models import AccountStatus, RoleEnum, User

# Kept for audit trail rows; accounts are created immediately (ACCEPTED).
INVITE_TTL = timedelta(days=365)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _phone_digits(value: str | None) -> str:
    return "".join(ch for ch in (value or "") if ch.isdigit())


class FamilyInviteService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _require_senior(self, user: User) -> Senior:
        if user.role != RoleEnum.SENIOR:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only seniors can manage family invites.",
            )
        senior = (
            await self.session.execute(select(Senior).where(Senior.user_id == user.id))
        ).scalar_one_or_none()
        if not senior:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Senior profile not found")
        return senior

    def _to_invite_response(
        self,
        invite: FamilyInvite,
        *,
        initial_password: str | None = None,
        account_created: bool = False,
        already_linked: bool = False,
    ) -> FamilyInviteResponse:
        return FamilyInviteResponse(
            id=invite.id,
            senior_id=invite.senior_id,
            first_name=invite.first_name,
            last_name=invite.last_name,
            relationship=invite.relationship,
            email=invite.email,
            phone=invite.phone,
            status=invite.status.value if isinstance(invite.status, FamilyInviteStatus) else str(invite.status),
            expires_at=invite.expires_at,
            created_at=invite.created_at,
            accepted_at=invite.accepted_at,
            access_id=invite.access_id,
            initial_password=initial_password,
            account_created=account_created,
            already_linked=already_linked,
        )

    async def create_invite(self, user: User, payload: FamilyInviteCreate) -> FamilyInviteResponse:
        """Create (or link) a FAMILY login immediately. Initial password = mobile digits."""
        senior = await self._require_senior(user)
        phone = _phone_digits(payload.phone)
        if len(phone) < 8:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Enter a valid mobile number.")

        email = payload.email
        if not email:
            email = f"{phone}@phone.eldcare.local"

        # Already linked to this senior?
        existing_access = await self._find_access_for_contact(senior.id, email=email, phone=phone)
        if existing_access:
            invite = FamilyInvite(
                id=uuid4(),
                senior_id=senior.id,
                email=None if email.endswith("@phone.eldcare.local") else email,
                phone=phone,
                first_name=payload.first_name,
                last_name=payload.last_name or "",
                relationship=payload.relationship,
                status=FamilyInviteStatus.ACCEPTED,
                invited_user_id=existing_access["user_id"],
                access_id=existing_access["access_id"],
                expires_at=_now() + INVITE_TTL,
                accepted_at=_now(),
            )
            self.session.add(invite)
            await self.session.commit()
            await self.session.refresh(invite)
            return self._to_invite_response(invite, already_linked=True)

        existing_user = await self._find_user_by_contact(email=email, phone=phone)
        account_created = False
        initial_password: str | None = None

        if existing_user:
            if existing_user.role != RoleEnum.FAMILY:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="That contact already belongs to a non-family EldCare account.",
                )
            family = (
                await self.session.execute(select(FamilyMember).where(FamilyMember.user_id == existing_user.id))
            ).scalar_one_or_none()
            if not family:
                family = FamilyMember(
                    id=uuid4(),
                    user_id=existing_user.id,
                    first_name=payload.first_name,
                    last_name=payload.last_name or "",
                    relationship=payload.relationship,
                )
                self.session.add(family)
                await self.session.flush()
            else:
                family.first_name = payload.first_name or family.first_name
                family.last_name = (payload.last_name or family.last_name or "")
                if payload.relationship:
                    family.relationship = payload.relationship
            user_row = existing_user
        else:
            email_taken = (
                await self.session.execute(select(User).where(User.email == email))
            ).scalar_one_or_none()
            if email_taken:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="That email is already registered.")
            phone_taken = await self._find_user_by_phone(phone)
            if phone_taken:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="That mobile is already registered.")

            user_row = User(
                id=uuid4(),
                email=email,
                phone=phone,
                hashed_password=get_password_hash(phone),
                role=RoleEnum.FAMILY,
                account_status=AccountStatus.ACTIVE,
            )
            self.session.add(user_row)
            await self.session.flush()
            family = FamilyMember(
                id=uuid4(),
                user_id=user_row.id,
                first_name=payload.first_name,
                last_name=payload.last_name or "",
                relationship=payload.relationship,
            )
            self.session.add(family)
            await self.session.flush()
            account_created = True
            initial_password = phone

        access = (
            await self.session.execute(
                select(FamilySeniorAccess).where(
                    FamilySeniorAccess.family_id == family.id,
                    FamilySeniorAccess.senior_id == senior.id,
                )
            )
        ).scalar_one_or_none()
        if not access:
            access = FamilySeniorAccess(id=uuid4(), family_id=family.id, senior_id=senior.id)
            self.session.add(access)
            await self.session.flush()

        invite = FamilyInvite(
            id=uuid4(),
            senior_id=senior.id,
            email=None if email.endswith("@phone.eldcare.local") else email,
            phone=phone,
            first_name=payload.first_name,
            last_name=payload.last_name or "",
            relationship=payload.relationship,
            status=FamilyInviteStatus.ACCEPTED,
            invited_user_id=user_row.id,
            access_id=access.id,
            expires_at=_now() + INVITE_TTL,
            accepted_at=_now(),
        )
        self.session.add(invite)
        await self.session.commit()
        await self.session.refresh(invite)

        if account_created and invite.email and smtp_configured():
            senior_name = " ".join(p for p in [senior.first_name, senior.last_name] if p).strip() or "A senior"
            try:
                await asyncio.to_thread(
                    send_family_welcome_email,
                    invite.email,
                    first_name=payload.first_name,
                    phone=phone,
                    senior_name=senior_name,
                )
            except Exception as exc:
                print(f"[EldCare family welcome] email failed for {invite.email}: {exc}")

        return self._to_invite_response(
            invite,
            initial_password=initial_password,
            account_created=account_created,
            already_linked=False,
        )

    async def list_circle(self, user: User) -> FamilyCircleResponse:
        senior = await self._require_senior(user)
        # Invites are provisioned immediately; circle UI is driven by linked members.
        access_rows = (
            await self.session.execute(
                select(
                    FamilySeniorAccess,
                    FamilyMember,
                    User,
                )
                .join(FamilyMember, FamilyMember.id == FamilySeniorAccess.family_id)
                .outerjoin(User, User.id == FamilyMember.user_id)
                .where(FamilySeniorAccess.senior_id == senior.id)
                .order_by(FamilySeniorAccess.created_at.desc())
            )
        ).all()

        members: list[FamilyCircleMember] = []
        for access, family, family_user in access_rows:
            members.append(
                FamilyCircleMember(
                    access_id=access.id,
                    family_id=family.id,
                    first_name=family.first_name or "",
                    last_name=family.last_name or "",
                    relationship=family.relationship,
                    email=getattr(family_user, "email", None) if family_user else None,
                    phone=getattr(family_user, "phone", None) if family_user else None,
                    linked_at=access.created_at,
                )
            )

        return FamilyCircleResponse(invites=[], members=members)

    async def resend_invite(self, user: User, invite_id: UUID) -> FamilyInviteResponse:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Family accounts are created immediately. Ask them to sign in or use Forgot password.",
        )

    async def revoke_invite(self, user: User, invite_id: UUID) -> FamilyInviteResponse:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use Remove on a linked family member instead.",
        )

    async def revoke_access(self, user: User, access_id: UUID) -> dict:
        senior = await self._require_senior(user)
        access = (
            await self.session.execute(
                select(FamilySeniorAccess).where(
                    FamilySeniorAccess.id == access_id,
                    FamilySeniorAccess.senior_id == senior.id,
                )
            )
        ).scalar_one_or_none()
        if not access:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family link not found")
        await self.session.delete(access)
        linked = (
            await self.session.execute(
                select(FamilyInvite).where(
                    FamilyInvite.access_id == access_id,
                    FamilyInvite.senior_id == senior.id,
                )
            )
        ).scalars().all()
        for invite in linked:
            invite.access_id = None
            if invite.status == FamilyInviteStatus.ACCEPTED:
                invite.status = FamilyInviteStatus.REVOKED
        await self.session.commit()
        return {"message": "Family access removed.", "access_id": str(access_id)}

    async def _find_user_by_phone(self, phone: str) -> User | None:
        digits = _phone_digits(phone)
        result = await self.session.execute(
            select(User).where(or_(User.phone == phone, User.phone == digits))
        )
        user = result.scalars().first()
        if user:
            return user
        if not digits:
            return None
        rows = (await self.session.execute(select(User).where(User.phone.is_not(None)))).scalars().all()
        return next((row for row in rows if _phone_digits(row.phone or "") == digits), None)

    async def _find_user_by_contact(self, *, email: str, phone: str) -> User | None:
        by_email = (
            await self.session.execute(select(User).where(User.email == email.strip().lower()))
        ).scalar_one_or_none()
        if by_email:
            return by_email
        return await self._find_user_by_phone(phone)

    async def _find_access_for_contact(self, senior_id: UUID, *, email: str, phone: str) -> dict | None:
        user = await self._find_user_by_contact(email=email, phone=phone)
        if not user:
            return None
        family = (
            await self.session.execute(select(FamilyMember).where(FamilyMember.user_id == user.id))
        ).scalar_one_or_none()
        if not family:
            return None
        access = (
            await self.session.execute(
                select(FamilySeniorAccess).where(
                    FamilySeniorAccess.family_id == family.id,
                    FamilySeniorAccess.senior_id == senior_id,
                )
            )
        ).scalar_one_or_none()
        if not access:
            return None
        return {"user_id": user.id, "access_id": access.id, "family_id": family.id}
