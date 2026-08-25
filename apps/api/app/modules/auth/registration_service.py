from datetime import date
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, create_refresh_token, get_password_hash
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


class RegistrationService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _ensure_unique_identity(self, email: str, phone: str) -> None:
        from sqlalchemy import select

        existing_email = (
            await self.session.execute(select(User).where(User.email == email.lower().strip()))
        ).scalar_one_or_none()
        if existing_email:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
        existing_phone = (
            await self.session.execute(select(User).where(User.phone == phone.strip()))
        ).scalar_one_or_none()
        if existing_phone:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone already exists")

    def _issue_tokens(self, user: User) -> RegistrationResponse:
        return RegistrationResponse(
            access_token=create_access_token(subject=str(user.id)),
            refresh_token=create_refresh_token(subject=str(user.id)),
            token_type="bearer",
            role=user.role.value,
            account_status=user.account_status.value if user.account_status else AccountStatus.ACTIVE.value,
            care_status=None,
            message="Registration successful.",
        )

    async def register_senior(self, payload: RegisterSeniorRequest) -> RegistrationResponse:
        await self._ensure_unique_identity(payload.email, payload.phone)
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
        )
        self.session.add(senior)
        await self.session.commit()
        await self.session.refresh(user)
        response = self._issue_tokens(user)
        response.message = "Senior account created. You can start using AgeWell."
        return response

    async def register_family(self, payload: RegisterFamilyRequest) -> RegistrationResponse:
        await self._ensure_unique_identity(payload.email, payload.phone)
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
        )
        self.session.add(family)
        await self.session.commit()
        await self.session.refresh(user)
        response = self._issue_tokens(user)
        response.message = (
            "Family account created. An AgeWell administrator must grant access to a senior before care data appears."
        )
        return response

    async def register_care_associate(self, payload: RegisterCareAssociateRequest) -> RegistrationResponse:
        await self._ensure_unique_identity(payload.email, payload.phone)
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
        response = self._issue_tokens(user)
        response.care_status = CARE_STATUS_PENDING
        response.message = "Application submitted. AgeWell will review your profile before you can take visits."
        return response
