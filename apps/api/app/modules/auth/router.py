from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi.security import OAuth2PasswordRequestForm
import jwt
from jwt import PyJWTError

from app.api.deps import get_db, get_current_user
from app.modules.users.models import AccountStatus, User
from app.modules.care.models import CARE_STATUS_DISABLED, CARE_STATUS_REJECTED, CareManager
from app.core.security import verify_password, create_access_token, create_refresh_token, ALGORITHM
from app.core.config import settings
from .schemas import (
    TokenResponse,
    RefreshRequest,
    RegisterSeniorRequest,
    RegisterFamilyRequest,
    RegisterCareAssociateRequest,
    RegistrationResponse,
)
from .registration_service import RegistrationService

router = APIRouter()


def _assert_login_allowed(user: User, care: CareManager | None = None) -> None:
    if user.account_status in (AccountStatus.REJECTED, AccountStatus.DISABLED):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is not allowed to sign in. Contact AgeWell support.",
        )
    if care and care.status in (CARE_STATUS_REJECTED, CARE_STATUS_DISABLED):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This care application was not approved. Contact AgeWell support.",
        )


@router.post("/register/senior", response_model=RegistrationResponse)
async def register_senior(payload: RegisterSeniorRequest, db: AsyncSession = Depends(get_db)):
    return await RegistrationService(db).register_senior(payload)


@router.post("/register/family", response_model=RegistrationResponse)
async def register_family(payload: RegisterFamilyRequest, db: AsyncSession = Depends(get_db)):
    return await RegistrationService(db).register_family(payload)


@router.post("/register/care-associate", response_model=RegistrationResponse)
async def register_care_associate(
    payload: RegisterCareAssociateRequest, db: AsyncSession = Depends(get_db)
):
    return await RegistrationService(db).register_care_associate(payload)


@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    # Form data has username and password. We map username to email.
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
        
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    care = (
        await db.execute(select(CareManager).where(CareManager.user_id == user.id))
    ).scalar_one_or_none()
    _assert_login_allowed(user, care)
        
    access_token = create_access_token(subject=str(user.id))
    refresh_token = create_refresh_token(subject=str(user.id))
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: RefreshRequest,
    db: AsyncSession = Depends(get_db)
):
    # Determine the token string (it could be in the body)
    token = request.refresh_token
    try:
        payload = jwt.decode(
            token, settings.JWT_REFRESH_SECRET, algorithms=[ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    except PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
        
    # Verify user still exists
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    care = (
        await db.execute(select(CareManager).where(CareManager.user_id == user.id))
    ).scalar_one_or_none()
    _assert_login_allowed(user, care)
        
    access_token = create_access_token(subject=str(user.id))
    new_refresh_token = create_refresh_token(subject=str(user.id))
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    # Currently using stateless JWT. In a real system, we'd add the token to a blacklist or invalidate the refresh token in the DB.
    # We will document this limitation.
    return {"message": "Successfully logged out. (Note: Stateless JWT logout - token revocation handled by client dropping token)"}
