from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, create_refresh_token, get_password_hash, verify_password
from app.modules.auth.otp_service import read_verified_email
from app.modules.auth.schemas import (
    RegisterCareAssociateRequest,
    RegisterFamilyRequest,
    RegisterSeniorRequest,
    RegistrationResponse,
)
from app.modules.care.models import CARE_STATUS_PENDING, CareManager
from app.modules.families.models import FamilyMember
from app.modules.seniors.models import Senior
from app.modules.users.models import AccountStatus, RoleEnum, User


def _phone_digits(value: str) -> str:
    return "".join(ch for ch in value if ch.isdigit())


class RegistrationService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _user_by_email(self, email: str) -> User | None:
        return (
            await self.session.execute(select(User).where(User.email == email.lower().strip()))
        ).scalar_one_or_none()

    async def _user_by_phone(self, phone: str) -> User | None:
        identity = (phone or "").strip()
        digits = _phone_digits(identity)
        result = await self.session.execute(
            select(User).where(or_(User.phone == identity, User.phone == digits))
        )
        user = result.scalars().first()
        if user:
            return user
        if not digits:
            return None
        rows = (await self.session.execute(select(User).where(User.phone.is_not(None)))).scalars().all()
        return next(
            (row for row in rows if _phone_digits(row.phone or "") == digits),
            None,
        )

    async def _existing_owner(
        self, email: str, phone: str, password: str, identity_token: str | None
    ) -> User | None:
        email_user = await self._user_by_email(email)
        phone_user = await self._user_by_phone(phone)
        verified_email = read_verified_email(identity_token)

        if email_user:
            if verified_email and verified_email == (email_user.email or "").lower():
                return email_user
            if email_user.hashed_password and verify_password(password, email_user.hashed_password):
                return email_user
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

        if phone_user:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone already exists")

        return None

    def _issue_tokens(self, user: User, message: str) -> RegistrationResponse:
        return RegistrationResponse(
            access_token=create_access_token(subject=str(user.id)),
            refresh_token=create_refresh_token(subject=str(user.id)),
            token_type="bearer",
            role=user.role.value,
            account_status=user.account_status.value if user.account_status else AccountStatus.ACTIVE.value,
            care_status=None,
            message=message,
        )

    async def register_senior(self, payload: RegisterSeniorRequest) -> RegistrationResponse:
        existing = await self._existing_owner(
            payload.email, payload.phone, payload.password, payload.identity_token
        )
        if existing:
            return self._issue_tokens(existing, "Welcome back. You're signed in.")

        user = User(
            id=uuid4(),
            email=str(payload.email).lower().strip(),
            phone=payload.phone.strip(),
            hashed_password=get_password_hash(payload.password),
            role=RoleEnum.SENIOR,
            account_status=AccountStatus.ACTIVE,
        )
        self.session.add(user)
        await self.session.flush()
        senior = Senior(
            id=uuid4(),
            user_id=user.id,
            first_name=payload.first_name.strip(),
            last_name=payload.last_name.strip(),
            date_of_birth=payload.date_of_birth,
            address=payload.address.strip(),
            emergency_contact=payload.emergency_contact.strip(),
            preferred_language=(payload.preferred_language or "").strip() or None,
        )
        self.session.add(senior)
        await self.session.commit()
        await self.session.refresh(user)
        return self._issue_tokens(user, "Senior account created. You can start using AgeWell.")

    async def register_family(self, payload: RegisterFamilyRequest) -> RegistrationResponse:
        existing = await self._existing_owner(
            payload.email, payload.phone, payload.password, payload.identity_token
        )
        if existing:
            return self._issue_tokens(existing, "Welcome back. You're signed in.")

        user = User(
            id=uuid4(),
            email=str(payload.email).lower().strip(),
            phone=payload.phone.strip(),
            hashed_password=get_password_hash(payload.password),
            role=RoleEnum.FAMILY,
            account_status=AccountStatus.ACTIVE,
        )
        self.session.add(user)
        await self.session.flush()
        reference = (payload.requested_senior_reference or "").strip() or None
        family = FamilyMember(
            id=uuid4(),
            user_id=user.id,
            first_name=payload.first_name.strip(),
            last_name=payload.last_name.strip(),
            relationship=payload.relationship.strip(),
            requested_senior_reference=reference,
            date_of_birth=payload.date_of_birth,
            address=(payload.address or "").strip() or None,
            preferred_language=(payload.preferred_language or "").strip() or None,
        )
        self.session.add(family)
        await self.session.commit()
        await self.session.refresh(user)
        return self._issue_tokens(
            user,
            "Family account created. An AgeWell administrator must grant access to a senior before care data appears.",
        )

    async def register_care_associate(self, payload: RegisterCareAssociateRequest) -> RegistrationResponse:
        existing = await self._existing_owner(payload.email, payload.phone, payload.password, None)
        if existing:
            return self._issue_tokens(existing, "Welcome back. You're signed in.")

        user = User(
            id=uuid4(),
            email=str(payload.email).lower().strip(),
            phone=payload.phone.strip(),
            hashed_password=get_password_hash(payload.password),
            role=RoleEnum.CARE_MANAGER,
            account_status=AccountStatus.ACTIVE,
        )
        self.session.add(user)
        await self.session.flush()
        employee_id = f"PEND-{str(user.id).replace('-', '')[:12].upper()}"
        care = CareManager(
            id=uuid4(),
            user_id=user.id,
            employee_id=employee_id,
            first_name=payload.first_name.strip(),
            last_name=payload.last_name.strip(),
            skills=(payload.skills or "").strip() or None,
            experience=(payload.experience or "").strip() or None,
            languages=(payload.languages or "").strip() or None,
            availability=(payload.availability or "").strip() or None,
            status=CARE_STATUS_PENDING,
        )
        self.session.add(care)
        await self.session.commit()
        await self.session.refresh(user)
        response = self._issue_tokens(
            user,
            "Application submitted. AgeWell will review your profile before you can take visits.",
        )
        response.care_status = CARE_STATUS_PENDING
        return response
