import asyncio
import uuid
from datetime import datetime, date
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.modules.users.models import User, RoleEnum
from app.core.security import get_password_hash
from app.modules.seniors.models import Senior
from app.modules.families.models import FamilyMember
from app.modules.care.models import CareManager
from app.modules.services.models import Service, ServiceCategory, ServiceRequest
from app.modules.healthcare.models import HealthcareProvider, Medication, MedicationSchedule
from app.modules.appointments.models import Appointment
from app.modules.visits.models import Visit, VisitTask, VisitReport
from app.modules.memberships.models import MembershipPlan, MembershipBenefit, Membership, MembershipUsageLedger
from app.modules.addons.models import AddOn, AddOnCategory
from app.modules.community.models import CommunityEvent
from app.modules.notifications.models import Notification
from app.modules.emergency.models import EmergencyCase, EmergencyEvent, EmergencyType
from app.modules.emergency.repository import CREATED_EVENT_DESCRIPTION
from seed_health import seed_health_dev_data


FALSE_DISPATCH_COPY = "Ambulance dispatched automatically."
OPERATIONS_EMAIL = "operations@example.com"
OPERATIONS_PHONE = "777"
BINGO_TITLE = "Bingo"
BINGO_DESCRIPTION = "Fun"
BINGO_CAPACITY = 20


async def repair_emergency_copy(session: AsyncSession) -> None:
    await session.execute(
        update(EmergencyEvent)
        .where(EmergencyEvent.event_description == FALSE_DISPATCH_COPY)
        .values(event_description=CREATED_EVENT_DESCRIPTION)
    )
    await session.commit()


async def seed_operations_user(session: AsyncSession) -> None:
    existing = (
        await session.execute(select(User).where(User.email == OPERATIONS_EMAIL))
    ).scalar_one_or_none()
    if existing:
        return
    session.add(
        User(
            id=uuid.uuid4(),
            email=OPERATIONS_EMAIL,
            phone=OPERATIONS_PHONE,
            role=RoleEnum.OPERATIONS,
            hashed_password=get_password_hash("password123"),
        )
    )
    await session.commit()


async def seed_bingo_event(session: AsyncSession) -> None:
    existing = (
        await session.execute(select(CommunityEvent).where(CommunityEvent.title == BINGO_TITLE))
    ).scalar_one_or_none()
    if existing:
        return
    session.add(
        CommunityEvent(
            id=uuid.uuid4(),
            title=BINGO_TITLE,
            description=BINGO_DESCRIPTION,
            event_date=datetime.utcnow(),
            capacity=BINGO_CAPACITY,
        )
    )
    await session.commit()

async def seed_data():
    async with AsyncSessionLocal() as session:
        existing = (
            await session.execute(select(User).where(User.email == "senior@example.com"))
        ).scalar_one_or_none()
        if existing:
            await repair_emergency_copy(session)
            await seed_operations_user(session)
            await seed_bingo_event(session)
            print("Users already exist. Emergency event copy repaired. Community seed ensured.")
            await seed_health_dev_data()
            return

        # Users
        pw_hash = get_password_hash("password123")
        u_senior = User(id=uuid.uuid4(), email="senior@example.com", phone="111", role=RoleEnum.SENIOR, hashed_password=pw_hash)
        u_family = User(id=uuid.uuid4(), email="family@example.com", phone="222", role=RoleEnum.FAMILY, hashed_password=pw_hash)
        u_family_b = User(id=uuid.uuid4(), email="family2@example.com", phone="333", role=RoleEnum.FAMILY, hashed_password=pw_hash)
        u_senior_b = User(id=uuid.uuid4(), email="senior2@example.com", phone="444", role=RoleEnum.SENIOR, hashed_password=pw_hash)
        u_care_mgr = User(id=uuid.uuid4(), email="care@example.com", phone="555", role=RoleEnum.CARE_MANAGER, hashed_password=pw_hash)
        u_admin = User(id=uuid.uuid4(), email="admin@example.com", phone="666", role=RoleEnum.ADMIN, hashed_password=pw_hash)
        u_ops = User(id=uuid.uuid4(), email=OPERATIONS_EMAIL, phone=OPERATIONS_PHONE, role=RoleEnum.OPERATIONS, hashed_password=pw_hash)
        session.add_all([u_senior, u_family, u_family_b, u_senior_b, u_care_mgr, u_admin, u_ops])
        await session.commit()

        # Profiles
        senior_a = Senior(id=uuid.uuid4(), user_id=u_senior.id, first_name="John", last_name="Doe", date_of_birth=date(1940, 1, 1), address="123", emergency_contact="911")
        senior_b = Senior(id=uuid.uuid4(), user_id=u_senior_b.id, first_name="Jane", last_name="Doe", date_of_birth=date(1945, 1, 1), address="456", emergency_contact="911")
        family = FamilyMember(id=uuid.uuid4(), user_id=u_family.id, first_name="Son", last_name="Doe")
        care_mgr = CareManager(
            id=uuid.uuid4(),
            user_id=u_care_mgr.id,
            employee_id="CM01",
            first_name="Rohit",
            last_name="Sharma",
            skills="Nursing",
            status="ACTIVE",
        )
        session.add_all([senior_a, senior_b, family, care_mgr])
        await session.commit()
        
        # Access
        from app.modules.access.models import FamilySeniorAccess
        access_allowed = FamilySeniorAccess(id=uuid.uuid4(), family_id=family.id, senior_id=senior_a.id)
        session.add(access_allowed)

        # Service
        service = Service(id=uuid.uuid4(), name="Physiotherapy", category=ServiceCategory.HEALTH, description="Test")
        session.add(service)
        await session.commit()
        
        # Request
        req = ServiceRequest(id=uuid.uuid4(), senior_id=senior_a.id, service_id=service.id)
        
        # Healthcare
        provider = HealthcareProvider(id=uuid.uuid4(), name="Dr. Smith", specialty="Cardiology")
        session.add(provider)
        await session.commit()
        
        med = Medication(id=uuid.uuid4(), senior_id=senior_a.id, name="Aspirin", dosage="100mg")
        session.add(med)
        await session.commit()
        
        schedule = MedicationSchedule(id=uuid.uuid4(), medication_id=med.id, schedule_time="08:00", frequency="Daily")
        
        appointment = Appointment(id=uuid.uuid4(), senior_id=senior_a.id, doctor_id=provider.id, scheduled_at=datetime.utcnow())
        
        # Visit
        visit = Visit(id=uuid.uuid4(), senior_id=senior_a.id, care_manager_id=care_mgr.id, scheduled_at=datetime.utcnow())
        session.add(visit)
        await session.commit()
        
        v_task = VisitTask(id=uuid.uuid4(), visit_id=visit.id, task_name="Check vitals", is_completed=True)
        v_report = VisitReport(id=uuid.uuid4(), visit_id=visit.id, summary="All good", issues_noted="None")
        
        # Membership
        plan = MembershipPlan(id=uuid.uuid4(), name="Premium", price=4999.00)
        session.add(plan)
        await session.commit()
        
        benefit = MembershipBenefit(id=uuid.uuid4(), plan_id=plan.id, benefit_name="Doctor Visits", quota=5)
        membership = Membership(id=uuid.uuid4(), senior_id=senior_a.id, plan_id=plan.id, start_date=datetime.utcnow(), end_date=datetime.utcnow())
        session.add_all([benefit, membership])
        await session.commit()
        
        ledger = MembershipUsageLedger(id=uuid.uuid4(), membership_id=membership.id, benefit_id=benefit.id, used_amount=1)
        
        # Addons
        addon = AddOn(id=uuid.uuid4(), name="Extra Meal", category=AddOnCategory.FOOD, price=100.00)
        
        # Community
        event = CommunityEvent(
            id=uuid.uuid4(),
            title=BINGO_TITLE,
            description=BINGO_DESCRIPTION,
            event_date=datetime.utcnow(),
            capacity=BINGO_CAPACITY,
        )
        
        # Notification
        notification = Notification(id=uuid.uuid4(), user_id=u_senior.id, title="Welcome", message="Welcome to AgeWell")
        
        # Emergency
        e_case = EmergencyCase(id=uuid.uuid4(), senior_id=senior_a.id, type=EmergencyType.MEDICAL)
        session.add(e_case)
        await session.commit()
        
        e_event = EmergencyEvent(id=uuid.uuid4(), case_id=e_case.id, event_description=CREATED_EVENT_DESCRIPTION)

        session.add_all([req, schedule, appointment, v_task, v_report, ledger, addon, event, notification, e_event])
        await session.commit()

        print("Total mock records initialized successfully covering all Phase 3 domains.")

    await seed_health_dev_data()

if __name__ == "__main__":
    asyncio.run(seed_data())
