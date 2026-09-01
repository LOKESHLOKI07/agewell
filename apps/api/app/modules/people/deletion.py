"""Cascade-delete people records so admin trash actions remove rows, not just disable login."""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import delete, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.access.models import FamilySeniorAccess
from app.modules.appointments.models import Appointment
from app.modules.care.models import CareManager
from app.modules.community.models import EventRegistration
from app.modules.documents.models import DocumentMetadata
from app.modules.emergency.models import EmergencyCase, EmergencyEvent
from app.modules.families.models import FamilyMember
from app.modules.healthcare.models import HealthDocument, LabResult, MedicalRecord, Medication, MedicationSchedule
from app.modules.memberships.models import Membership, MembershipRequest, MembershipUsageLedger
from app.modules.notifications.models import Notification, NotificationPreference
from app.modules.orders.models import Order, OrderItem
from app.modules.payments.models import Payment, PaymentTransaction
from app.modules.seniors.models import Senior
from app.modules.services.models import ServiceRequest
from app.modules.tracking.models import LocationPoint, LocationSession
from app.modules.users.models import User
from app.modules.visits.models import Visit, VisitReport, VisitTask

STILL_LINKED = "This record is still linked to other AgeWell data and could not be deleted."


def _uid(value) -> UUID:
    return value if isinstance(value, UUID) else UUID(str(value))


async def commit_people_delete(session: AsyncSession) -> None:
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=STILL_LINKED) from None


async def delete_senior_record(session: AsyncSession, senior_id, *, also_user: bool = True) -> None:
    senior_id = _uid(senior_id)
    senior = (await session.execute(select(Senior).where(Senior.id == senior_id))).scalars().first()
    if not senior:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Senior not found")
    user_id = senior.user_id
    session.expunge_all()

    visit_ids = select(Visit.id).where(Visit.senior_id == senior_id)
    await session.execute(delete(VisitTask).where(VisitTask.visit_id.in_(visit_ids)))
    await session.execute(delete(VisitReport).where(VisitReport.visit_id.in_(visit_ids)))
    await session.execute(delete(Visit).where(Visit.senior_id == senior_id))

    case_ids = select(EmergencyCase.id).where(EmergencyCase.senior_id == senior_id)
    await session.execute(delete(EmergencyEvent).where(EmergencyEvent.case_id.in_(case_ids)))
    await session.execute(delete(EmergencyCase).where(EmergencyCase.senior_id == senior_id))

    membership_ids = select(Membership.id).where(Membership.senior_id == senior_id)
    await session.execute(delete(MembershipUsageLedger).where(MembershipUsageLedger.membership_id.in_(membership_ids)))
    await session.execute(delete(MembershipRequest).where(MembershipRequest.senior_id == senior_id))
    await session.execute(delete(Membership).where(Membership.senior_id == senior_id))

    medication_ids = select(Medication.id).where(Medication.senior_id == senior_id)
    await session.execute(delete(MedicationSchedule).where(MedicationSchedule.medication_id.in_(medication_ids)))
    await session.execute(delete(Medication).where(Medication.senior_id == senior_id))
    await session.execute(delete(MedicalRecord).where(MedicalRecord.senior_id == senior_id))
    await session.execute(delete(HealthDocument).where(HealthDocument.senior_id == senior_id))
    await session.execute(delete(LabResult).where(LabResult.senior_id == senior_id))

    await session.execute(delete(FamilySeniorAccess).where(FamilySeniorAccess.senior_id == senior_id))
    await session.execute(delete(Appointment).where(Appointment.senior_id == senior_id))
    await session.execute(delete(ServiceRequest).where(ServiceRequest.senior_id == senior_id))
    await session.execute(delete(Senior).where(Senior.id == senior_id))
    await session.flush()

    if also_user and user_id is not None:
        await delete_user_record(session, user_id, also_profile=False)


async def delete_family_record(session: AsyncSession, family_id, *, also_user: bool = True) -> None:
    family_id = _uid(family_id)
    family = (await session.execute(select(FamilyMember).where(FamilyMember.id == family_id))).scalars().first()
    if not family:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family member not found")
    user_id = family.user_id
    session.expunge_all()
    await session.execute(delete(FamilySeniorAccess).where(FamilySeniorAccess.family_id == family_id))
    await session.execute(delete(FamilyMember).where(FamilyMember.id == family_id))
    await session.flush()
    if also_user and user_id is not None:
        await delete_user_record(session, user_id, also_profile=False)


async def delete_care_record(session: AsyncSession, care_manager_id, *, also_user: bool = True) -> None:
    care_manager_id = _uid(care_manager_id)
    care = (await session.execute(select(CareManager).where(CareManager.id == care_manager_id))).scalars().first()
    if not care:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Care manager not found")
    user_id = care.user_id
    session.expunge_all()
    await session.execute(
        update(Visit).where(Visit.care_manager_id == care_manager_id).values(care_manager_id=None)
    )
    await session.execute(delete(CareManager).where(CareManager.id == care_manager_id))
    await session.flush()
    if also_user and user_id is not None:
        await delete_user_record(session, user_id, also_profile=False)


async def delete_user_record(
    session: AsyncSession,
    user_id,
    *,
    also_profile: bool = True,
    actor_user_id=None,
) -> None:
    user_id = _uid(user_id)
    if actor_user_id is not None and _uid(actor_user_id) == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot delete your own account.")

    user = (await session.execute(select(User).where(User.id == user_id))).scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    session.expunge_all()

    if also_profile:
        senior = (await session.execute(select(Senior).where(Senior.user_id == user_id))).scalars().first()
        if senior:
            await delete_senior_record(session, senior.id, also_user=False)
        family = (await session.execute(select(FamilyMember).where(FamilyMember.user_id == user_id))).scalars().first()
        if family:
            await delete_family_record(session, family.id, also_user=False)
        care = (await session.execute(select(CareManager).where(CareManager.user_id == user_id))).scalars().first()
        if care:
            await delete_care_record(session, care.id, also_user=False)

    session_ids = select(LocationSession.id).where(LocationSession.user_id == user_id)
    await session.execute(delete(LocationPoint).where(LocationPoint.session_id.in_(session_ids)))
    await session.execute(delete(LocationSession).where(LocationSession.user_id == user_id))

    order_ids = select(Order.id).where(Order.user_id == user_id)
    payment_ids = select(Payment.id).where(Payment.order_id.in_(order_ids))
    await session.execute(delete(PaymentTransaction).where(PaymentTransaction.payment_id.in_(payment_ids)))
    await session.execute(delete(Payment).where(Payment.order_id.in_(order_ids)))
    await session.execute(delete(OrderItem).where(OrderItem.order_id.in_(order_ids)))
    await session.execute(delete(Order).where(Order.user_id == user_id))

    await session.execute(delete(EventRegistration).where(EventRegistration.user_id == user_id))
    await session.execute(delete(DocumentMetadata).where(DocumentMetadata.owner_id == user_id))
    await session.execute(delete(NotificationPreference).where(NotificationPreference.user_id == user_id))
    await session.execute(delete(Notification).where(Notification.user_id == user_id))
    await session.execute(delete(User).where(User.id == user_id))
    await session.flush()
