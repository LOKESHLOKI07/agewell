from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, select
from fastapi.security import OAuth2PasswordRequestForm
import asyncio
import jwt
from jwt import PyJWTError

from app.api.deps import get_db, get_current_user
from app.modules.users.models import User
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    get_password_hash,
    ALGORITHM,
)
from app.core.config import settings
from .schemas import (
    EmailOtpRequest,
    EmailOtpVerifyRequest,
    EmailOtpVerifyResponse,
    GoogleAuthRequest,
    GoogleAuthResponse,
    PasswordResetRequest,
    PasswordResetResponse,
    PasswordResetVerifyResponse,
    TokenResponse,
    RefreshRequest,
    RegisterSeniorRequest,
    RegisterFamilyRequest,
    RegisterCareAssociateRequest,
    RegistrationResponse,
)
from .otp_service import (
    can_send_otp,
    create_otp_session_token,
    create_password_reset_token,
    generate_otp_code,
    read_password_reset_email,
    store_otp,
    verify_stored_otp,
)
from .mailer import send_otp_email, smtp_configured
from .google_oauth import google_profile_from_code, google_profile_from_id_token
from .registration_service import RegistrationService

try:
    from app.modules.users.models import AccountStatus
except ImportError:
    AccountStatus = None

try:
    from app.modules.care.models import CARE_STATUS_DISABLED, CARE_STATUS_REJECTED, CareManager
except ImportError:
    CareManager = None  # type: ignore[misc, assignment]
    CARE_STATUS_DISABLED = "DISABLED"
    CARE_STATUS_REJECTED = "REJECTED"

router = APIRouter()


def _phone_digits(value: str) -> str:
    return "".join(ch for ch in value if ch.isdigit())


async def _find_login_user(db: AsyncSession, username: str) -> User | None:
    identity = (username or "").strip()
    if not identity:
        return None
    if "@" in identity:
        result = await db.execute(select(User).where(User.email == identity.lower()))
        return result.scalar_one_or_none()

    digits = _phone_digits(identity)
    result = await db.execute(
        select(User).where(or_(User.phone == identity, User.phone == digits))
    )
    user = result.scalars().first()
    if user:
        return user
    if not digits:
        return None
    rows = (await db.execute(select(User).where(User.phone.is_not(None)))).scalars().all()
    return next(
        (row for row in rows if _phone_digits(row.phone or "") == digits),
        None,
    )


def _assert_login_allowed(user: User, care=None) -> None:
    account_status = getattr(user, "account_status", None)
    if AccountStatus is not None and account_status in (AccountStatus.REJECTED, AccountStatus.DISABLED):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is not allowed to sign in. Contact AgeWell support.",
        )
    if care is not None and getattr(care, "status", None) in (CARE_STATUS_REJECTED, CARE_STATUS_DISABLED):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This care application was not approved. Contact AgeWell support.",
        )


@router.post("/google", response_model=GoogleAuthResponse)
async def google_auth(payload: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    if (payload.id_token or "").strip():
        profile = await google_profile_from_id_token(payload.id_token.strip())
    else:
        profile = await google_profile_from_code(
            code=payload.code or "",
            redirect_uri=payload.redirect_uri or "",
            code_verifier=payload.code_verifier or "",
        )
    email = profile["email"]
    user = await _find_login_user(db, email)
    if user:
        care = (
            await db.execute(select(CareManager).where(CareManager.user_id == user.id))
        ).scalar_one_or_none()
        _assert_login_allowed(user, care)
        return GoogleAuthResponse(
            is_new=False,
            email=email,
            full_name=profile.get("full_name"),
            access_token=create_access_token(subject=str(user.id)),
            refresh_token=create_refresh_token(subject=str(user.id)),
        )
    return GoogleAuthResponse(
        is_new=True,
        email=email,
        full_name=profile.get("full_name"),
        identity_token=create_otp_session_token(email, "google_verified"),
    )


OTP_SENT_MESSAGE = "If that email can receive mail, a verification code is on its way."


async def _send_email_otp(email: str) -> dict:
    if not smtp_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email sending is not configured.",
        )
    can_send_otp(email)
    code = generate_otp_code()
    store_otp(email, code)
    try:
        await asyncio.to_thread(send_otp_email, email, code)
    except Exception:
        if settings.ENVIRONMENT == "development":
            print(f"[AgeWell OTP] send failed; code for {email} is {code}")
        else:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="We could not send the email. Please try again shortly.",
            )
    return {"message": OTP_SENT_MESSAGE}


@router.post("/otp/email/request")
async def request_email_otp(payload: EmailOtpRequest):
    return await _send_email_otp(payload.email)


@router.post("/otp/email/verify", response_model=EmailOtpVerifyResponse)
async def verify_email_otp(payload: EmailOtpVerifyRequest, db: AsyncSession = Depends(get_db)):
    verify_stored_otp(payload.email, payload.code)
    user = await _find_login_user(db, payload.email)
    if user:
        care = (
            await db.execute(select(CareManager).where(CareManager.user_id == user.id))
        ).scalar_one_or_none()
        _assert_login_allowed(user, care)
        return EmailOtpVerifyResponse(
            is_new=False,
            email=payload.email,
            access_token=create_access_token(subject=str(user.id)),
            refresh_token=create_refresh_token(subject=str(user.id)),
        )
    return EmailOtpVerifyResponse(
        is_new=True,
        email=payload.email,
        otp_session_token=create_otp_session_token(payload.email),
    )


@router.post("/password/forgot")
async def forgot_password(payload: EmailOtpRequest, db: AsyncSession = Depends(get_db)):
    user = await _find_login_user(db, payload.email)
    if not user:
        return {"message": OTP_SENT_MESSAGE}
    care = (
        await db.execute(select(CareManager).where(CareManager.user_id == user.id))
    ).scalar_one_or_none()
    try:
        _assert_login_allowed(user, care)
    except HTTPException:
        return {"message": OTP_SENT_MESSAGE}
    return await _send_email_otp(payload.email)


@router.post("/password/verify", response_model=PasswordResetVerifyResponse)
async def verify_password_reset(payload: EmailOtpVerifyRequest, db: AsyncSession = Depends(get_db)):
    verify_stored_otp(payload.email, payload.code)
    user = await _find_login_user(db, payload.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No AgeWell account uses this email yet. Create an account from Welcome.",
        )
    care = (
        await db.execute(select(CareManager).where(CareManager.user_id == user.id))
    ).scalar_one_or_none()
    _assert_login_allowed(user, care)
    return PasswordResetVerifyResponse(
        email=payload.email,
        reset_token=create_password_reset_token(payload.email),
    )


@router.post("/password/reset", response_model=PasswordResetResponse)
async def reset_password(payload: PasswordResetRequest, db: AsyncSession = Depends(get_db)):
    email = read_password_reset_email(payload.reset_token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This reset step has expired. Request a new code.",
        )
    user = await _find_login_user(db, email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No AgeWell account uses this email yet. Create an account from Welcome.",
        )
    care = (
        await db.execute(select(CareManager).where(CareManager.user_id == user.id))
    ).scalar_one_or_none()
    _assert_login_allowed(user, care)
    user.hashed_password = get_password_hash(payload.password)
    await db.commit()
    return PasswordResetResponse(message="Password updated. Sign in with your new password.")


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
    user = await _find_login_user(db, form_data.username)

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
