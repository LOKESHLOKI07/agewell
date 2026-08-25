from app.api.schemas import ListPage
from app.modules.audit.repository import AuditRepository
from app.modules.audit.schemas import AuditLogResponse


class AuditService:
    def __init__(self, repo: AuditRepository):
        self.repo = repo

    async def list_logs(self, *, limit: int = 50, offset: int = 0) -> ListPage[AuditLogResponse]:
        rows, total = await self.repo.list_logs(limit=limit, offset=offset)
        return ListPage(
            items=[AuditLogResponse.model_validate(row) for row in rows],
            total=total,
            limit=limit,
            offset=offset,
        )
