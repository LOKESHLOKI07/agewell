from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.models import RoleEnum, User
from app.modules.users.schemas import UserCreate


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, user_id):
        stmt = select(User).where(User.id == user_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.session.execute(select(User).where(User.email == email))
        return result.scalars().first()

    async def get_by_phone(self, phone: str) -> Optional[User]:
        result = await self.session.execute(select(User).where(User.phone == phone))
        return result.scalars().first()

    async def list_users(
        self,
        *,
        role: Optional[RoleEnum] = None,
        email: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ):
        stmt = select(User)
        count_stmt = select(func.count()).select_from(User)
        if role is not None:
            stmt = stmt.where(User.role == role)
            count_stmt = count_stmt.where(User.role == role)
        if email:
            pattern = f"%{email.strip()}%"
            stmt = stmt.where(User.email.ilike(pattern))
            count_stmt = count_stmt.where(User.email.ilike(pattern))
        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(
            stmt.order_by(User.created_at.desc().nulls_last()).offset(offset).limit(limit)
        )
        return list(result.scalars().all()), int(total)

    async def create(self, user: UserCreate) -> User:
        from app.modules.users.models import AccountStatus

        db_user = User(
            email=user.email,
            phone=user.phone,
            role=user.role,
            hashed_password=user.password,
            account_status=user.account_status or AccountStatus.ACTIVE,
        )
        self.session.add(db_user)
        await self.session.commit()
        await self.session.refresh(db_user)
        return db_user

    async def save(self, user: User) -> User:
        await self.session.commit()
        await self.session.refresh(user)
        return user
