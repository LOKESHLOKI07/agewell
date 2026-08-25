from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession


class StaffReadRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_rows(self, model, *, limit: int, offset: int):
        total = (await self.session.execute(select(func.count()).select_from(model))).scalar_one()
        rows = (await self.session.execute(select(model).offset(offset).limit(limit))).scalars().all()
        return list(rows), int(total)
