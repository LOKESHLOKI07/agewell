from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.audit.models import AuditLog


class AuditRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def record(
        self,
        *,
        entity_name: str,
        entity_id: str,
        action: str,
        changes: Optional[str] = None,
    ) -> AuditLog:
        row = AuditLog(
            entity_name=entity_name,
            entity_id=entity_id,
            action=action,
            changes=changes,
        )
        self.session.add(row)
        await self.session.flush()
        return row

    async def list_logs(self, *, limit: int = 50, offset: int = 0):
        count_stmt = select(func.count()).select_from(AuditLog)
        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(
            select(AuditLog)
            .order_by(AuditLog.created_at.desc().nulls_last())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all()), int(total)
