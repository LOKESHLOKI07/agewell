from fastapi import APIRouter

from app.modules.auth.router import router as auth_router
from app.modules.users.router import router as users_router
from app.modules.seniors.router import router as seniors_router
from app.modules.services.router import router as services_router

from app.modules.families.router import router as families_router
from app.modules.access.router import router as access_router
from app.modules.care.router import router as care_router
from app.modules.visits.router import router as visits_router
from app.modules.appointments.router import router as appointments_router
from app.modules.memberships.router import router as memberships_router
from app.modules.addons.router import router as addons_router
from app.modules.notifications.router import router as notifications_router
from app.modules.community.router import router as community_router
from app.modules.orders.router import router as orders_router
from app.modules.payments.router import router as payments_router
from app.modules.tracking.router import router as tracking_router
from app.modules.healthcare.router import router as healthcare_router
from app.modules.emergency.router import router as emergency_router
from app.modules.documents.router import router as documents_router
from app.modules.audit.router import router as audit_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(seniors_router, prefix="/seniors", tags=["seniors"])
api_router.include_router(services_router, prefix="/services", tags=["services"])

api_router.include_router(families_router, prefix='/families', tags=['families'])
api_router.include_router(access_router, prefix='/access', tags=['access'])
api_router.include_router(care_router, prefix='/care', tags=['care'])
api_router.include_router(visits_router, prefix='/visits', tags=['visits'])
api_router.include_router(appointments_router, prefix='/appointments', tags=['appointments'])
api_router.include_router(memberships_router, prefix='/memberships', tags=['memberships'])
api_router.include_router(addons_router, prefix='/addons', tags=['addons'])
api_router.include_router(notifications_router, prefix='/notifications', tags=['notifications'])
api_router.include_router(community_router, prefix='/community', tags=['community'])
api_router.include_router(orders_router, prefix='/orders', tags=['orders'])
api_router.include_router(payments_router, prefix='/payments', tags=['payments'])
api_router.include_router(tracking_router, prefix='/tracking', tags=['tracking'])
api_router.include_router(healthcare_router, prefix='/healthcare', tags=['healthcare'])
api_router.include_router(emergency_router, prefix='/emergency', tags=['emergency'])
api_router.include_router(documents_router, prefix='/documents', tags=['documents'])
api_router.include_router(audit_router, prefix='/audit', tags=['audit'])
