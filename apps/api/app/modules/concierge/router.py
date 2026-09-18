from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.modules.access.repository import AccessRepository
from app.modules.access.service import AccessService
from app.modules.audit.repository import AuditRepository
from app.modules.care.activity_service import CareActivityService
from app.modules.care.repository import CareManagerRepository
from app.modules.concierge.schemas import (
    ConciergeConfirmRequest,
    ConciergeConfirmResponse,
    ConciergeTurnRequest,
    ConciergeTurnResponse,
)
from app.modules.concierge.service import ConciergeService
from app.modules.deliveries.repository import DeliveryRepository
from app.modules.deliveries.service import DeliveryService
from app.modules.memberships.repository import MembershipRepository
from app.modules.memberships.service import MembershipService
from app.modules.notifications.repository import NotificationRepository
from app.modules.seniors.repository import SeniorRepository
from app.modules.services.repository import ServiceRepository
from app.modules.services.service import ServiceManager
from app.modules.users.models import User

router = APIRouter()


def get_concierge_service(db: AsyncSession = Depends(get_db)) -> ConciergeService:
    seniors = SeniorRepository(db)
    access = AccessService(AccessRepository(db), seniors)
    return ConciergeService(
        db=db,
        access=access,
        memberships=MembershipService(MembershipRepository(db)),
        deliveries=DeliveryService(DeliveryRepository(db)),
        services=ServiceManager(ServiceRepository(db), AuditRepository(db)),
        care_activities=CareActivityService(
            CareManagerRepository(db),
            seniors,
            AccessRepository(db),
            NotificationRepository(db),
            AuditRepository(db),
        ),
    )


@router.post("/turn", response_model=ConciergeTurnResponse)
async def concierge_turn(
    payload: ConciergeTurnRequest,
    current_user: User = Depends(get_current_user),
    service: ConciergeService = Depends(get_concierge_service),
):
    return await service.turn(current_user, payload.message.strip(), payload.session_id)


@router.post("/confirm", response_model=ConciergeConfirmResponse)
async def concierge_confirm(
    payload: ConciergeConfirmRequest,
    current_user: User = Depends(get_current_user),
    service: ConciergeService = Depends(get_concierge_service),
):
    return await service.confirm(current_user, payload.confirmation_id, payload.session_id)
