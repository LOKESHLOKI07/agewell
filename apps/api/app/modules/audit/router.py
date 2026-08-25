from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_staff
from app.api.schemas import ListPage
from app.modules.audit.repository import AuditRepository
from app.modules.audit.schemas import AuditLogResponse
from app.modules.audit.service import AuditService
from app.modules.users.models import User

router = APIRouter()


def get_audit_service(db: AsyncSession = Depends(get_db)):
    return AuditService(AuditRepository(db))


@router.get("/", response_model=ListPage[AuditLogResponse])
async def list_audit_logs(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    _staff: User = Depends(require_staff),
    service: AuditService = Depends(get_audit_service),
):
    return await service.list_logs(limit=limit, offset=offset)
