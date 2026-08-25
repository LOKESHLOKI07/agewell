from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_staff
from app.api.schemas import ListPage
from app.modules.audit.repository import AuditRepository
from app.modules.users.models import RoleEnum, User
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreate, UserResponse, UserUpdate
from app.modules.users.service import UserService, to_user_response

router = APIRouter()


def get_user_service(db: AsyncSession = Depends(get_db)):
    return UserService(UserRepository(db), AuditRepository(db))


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return to_user_response(current_user)


@router.get("/", response_model=ListPage[UserResponse])
async def list_users(
    role: Optional[RoleEnum] = None,
    email: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    _staff: User = Depends(require_staff),
    service: UserService = Depends(get_user_service),
):
    return await service.list_users(role=role, email=email, limit=limit, offset=offset)


@router.post("/", response_model=UserResponse)
async def create_user(
    user_in: UserCreate,
    _staff: User = Depends(require_staff),
    service: UserService = Depends(get_user_service),
):
    return await service.create_user(user_in)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    _staff: User = Depends(require_staff),
    service: UserService = Depends(get_user_service),
):
    user = await service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    payload: UserUpdate,
    _staff: User = Depends(require_staff),
    service: UserService = Depends(get_user_service),
):
    return await service.update_user(user_id, payload)


@router.delete("/{user_id}", response_model=UserResponse)
async def delete_user(
    user_id: UUID,
    current_user: User = Depends(require_staff),
    service: UserService = Depends(get_user_service),
):
    return await service.delete_user(user_id, actor_user_id=current_user.id)
