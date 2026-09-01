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
from app.modules.services.addon_catalog import ADDON_BOOKING_SERVICES
from app.modules.services.membership_catalog import MEMBERSHIP_SERVICES
from app.modules.healthcare.models import HealthcareProvider, Medication, MedicationSchedule
from app.modules.appointments.models import Appointment
from app.modules.visits.models import Visit, VisitTask, VisitReport
from app.modules.memberships.models import MembershipPlan, MembershipBenefit, Membership, MembershipUsageLedger
from app.modules.addons.models import AddOn, AddOnCategory
from app.modules.community.models import CommunityEvent
from app.modules.notifications.models import Notification
from app.modules.emergency.models import EmergencyCase, EmergencyEvent, EmergencyType
from app.modules.emergency.repository import CREATED_EVENT_DESCRIPTION
from app.modules.catalog.models import FoodCuisine, FoodMenuItem, GroceryCategory, GroceryProduct, ServiceOffering
from app.modules.catalog.seed_data import (
    SEED_FOOD_CUISINES,
    SEED_FOOD_MENU,
    SEED_GROCERY_CATEGORIES,
    SEED_GROCERY_PRODUCTS,
    SEED_SERVICE_OFFERINGS,
)
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

async def seed_membership_services(session: AsyncSession) -> int:
    """Upsert Basic Membership + home add-on booking services by slug (idempotent)."""
    created_or_updated = 0
    for item in [*MEMBERSHIP_SERVICES, *ADDON_BOOKING_SERVICES]:
        existing = (
            await session.execute(select(Service).where(Service.slug == item["slug"]))
        ).scalar_one_or_none()
        if existing:
            existing.name = item["name"]
            existing.category = item["category"]
            existing.description = item["description"]
            created_or_updated += 1
            continue
        by_name = (
            await session.execute(select(Service).where(Service.name == item["name"]))
        ).scalar_one_or_none()
        if by_name and not by_name.slug:
            by_name.slug = item["slug"]
            by_name.category = item["category"]
            by_name.description = item["description"]
            created_or_updated += 1
            continue
        session.add(
            Service(
                id=uuid.uuid4(),
                slug=item["slug"],
                name=item["name"],
                category=item["category"],
                description=item["description"],
            )
        )
        created_or_updated += 1
    await session.commit()
    return created_or_updated


async def seed_delivery_catalogs(session: AsyncSession) -> int:
    """Upsert grocery + food catalog defaults by name (idempotent)."""
    touched = 0
    category_ids: dict[str, uuid.UUID] = {}
    for item in SEED_GROCERY_CATEGORIES:
        existing = (
            await session.execute(select(GroceryCategory).where(GroceryCategory.name == item["name"]))
        ).scalar_one_or_none()
        if existing:
            existing.sort_order = item["sort_order"]
            existing.is_active = True
            category_ids[item["key"]] = existing.id
            touched += 1
            continue
        row = GroceryCategory(
            id=uuid.uuid4(),
            name=item["name"],
            sort_order=item["sort_order"],
            is_active=True,
        )
        session.add(row)
        await session.flush()
        category_ids[item["key"]] = row.id
        touched += 1

    for item in SEED_GROCERY_PRODUCTS:
        category_id = category_ids[item["category_key"]]
        existing = (
            await session.execute(
                select(GroceryProduct).where(
                    GroceryProduct.name == item["name"],
                    GroceryProduct.category_id == category_id,
                )
            )
        ).scalar_one_or_none()
        if existing:
            existing.unit = item["unit"]
            existing.price_label = item["price_label"]
            existing.is_active = True
            touched += 1
            continue
        session.add(
            GroceryProduct(
                id=uuid.uuid4(),
                category_id=category_id,
                name=item["name"],
                unit=item["unit"],
                price_label=item["price_label"],
                is_active=True,
            )
        )
        touched += 1

    cuisine_ids: dict[str, uuid.UUID] = {}
    for item in SEED_FOOD_CUISINES:
        existing = (
            await session.execute(select(FoodCuisine).where(FoodCuisine.name == item["name"]))
        ).scalar_one_or_none()
        if existing:
            existing.description = item["description"]
            existing.sort_order = item["sort_order"]
            existing.is_active = True
            cuisine_ids[item["key"]] = existing.id
            touched += 1
            continue
        row = FoodCuisine(
            id=uuid.uuid4(),
            name=item["name"],
            description=item["description"],
            sort_order=item["sort_order"],
            is_active=True,
        )
        session.add(row)
        await session.flush()
        cuisine_ids[item["key"]] = row.id
        touched += 1

    for item in SEED_FOOD_MENU:
        cuisine_id = cuisine_ids[item["cuisine_key"]]
        meal = item["meal"]
        existing = (
            await session.execute(
                select(FoodMenuItem).where(
                    FoodMenuItem.name == item["name"],
                    FoodMenuItem.cuisine_id == cuisine_id,
                    FoodMenuItem.meal == meal,
                )
            )
        ).scalar_one_or_none()
        if existing:
            existing.price_label = item["price_label"]
            existing.is_active = True
            touched += 1
            continue
        session.add(
            FoodMenuItem(
                id=uuid.uuid4(),
                cuisine_id=cuisine_id,
                meal=meal,
                name=item["name"],
                price_label=item["price_label"],
                is_active=True,
            )
        )
        touched += 1

    await session.commit()
    return touched


async def seed_service_offerings(session: AsyncSession) -> int:
    """Upsert shared membership offerings by slug + title (idempotent)."""
    touched = 0
    for item in SEED_SERVICE_OFFERINGS:
        existing = (
            await session.execute(
                select(ServiceOffering).where(
                    ServiceOffering.service_slug == item["service_slug"],
                    ServiceOffering.title == item["title"],
                )
            )
        ).scalar_one_or_none()
        if existing:
            existing.description = item.get("description", "")
            existing.badge = item.get("badge", "")
            existing.price_label = item.get("price_label", "")
            existing.meta_json = item.get("meta_json")
            existing.sort_order = item.get("sort_order", 0)
            existing.is_active = True
            touched += 1
            continue
        session.add(
            ServiceOffering(
                id=uuid.uuid4(),
                service_slug=item["service_slug"],
                title=item["title"],
                description=item.get("description", ""),
                badge=item.get("badge", ""),
                price_label=item.get("price_label", ""),
                meta_json=item.get("meta_json"),
                sort_order=item.get("sort_order", 0),
                is_active=True,
            )
        )
        touched += 1
    await session.commit()
    return touched


async def seed_membership_plans(session: AsyncSession) -> int:
    """Upsert Basic and Couple membership plans (idempotent by name)."""
    plans = [
        {
            "name": "Basic Membership",
            "price": 15499.00,
            "benefits": [
                ("Membership services", 1),
                ("Entrance CCTV add-on (Rs 4,000)", 1),
                ("Panic buttons with CCTV pack", 2),
            ],
        },
        {
            "name": "Couple Membership",
            "price": 18499.00,
            "benefits": [
                ("Membership services", 1),
                ("Entrance CCTV add-on (Rs 5,500)", 1),
                ("Panic buttons with CCTV pack", 3),
            ],
        },
    ]
    touched = 0
    for item in plans:
        existing = (
            await session.execute(select(MembershipPlan).where(MembershipPlan.name == item["name"]))
        ).scalar_one_or_none()
        if existing:
            existing.price = item["price"]
            plan_id = existing.id
            touched += 1
        else:
            plan_id = uuid.uuid4()
            session.add(MembershipPlan(id=plan_id, name=item["name"], price=item["price"]))
            await session.flush()
            touched += 1
        for benefit_name, quota in item["benefits"]:
            benefit = (
                await session.execute(
                    select(MembershipBenefit).where(
                        MembershipBenefit.plan_id == plan_id,
                        MembershipBenefit.benefit_name == benefit_name,
                    )
                )
            ).scalar_one_or_none()
            if benefit:
                benefit.quota = quota
                touched += 1
                continue
            session.add(
                MembershipBenefit(
                    id=uuid.uuid4(),
                    plan_id=plan_id,
                    benefit_name=benefit_name,
                    quota=quota,
                )
            )
            touched += 1
    await session.commit()
    return touched


async def seed_data():
    async with AsyncSessionLocal() as session:
        existing = (
            await session.execute(select(User).where(User.email == "senior@example.com"))
        ).scalar_one_or_none()
        if not existing:
            existing = (
                await session.execute(select(User).where(User.email == "admin@example.com"))
            ).scalar_one_or_none()
        if existing:
            await repair_emergency_copy(session)
            await seed_operations_user(session)
            await seed_bingo_event(session)
            count = await seed_membership_services(session)
            catalog_count = await seed_delivery_catalogs(session)
            offerings_count = await seed_service_offerings(session)
            plans_count = await seed_membership_plans(session)
            print(
                f"Users already exist. Emergency event copy repaired. "
                f"Community seed ensured. Membership services upserted ({count}). "
                f"Delivery catalogs upserted ({catalog_count}). "
                f"Service offerings upserted ({offerings_count}). "
                f"Membership plans upserted ({plans_count})."
            )
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

        # Membership catalogue (19) + keep a sample request on tech-assistance
        await seed_membership_services(session)
        await seed_delivery_catalogs(session)
        await seed_service_offerings(session)
        await seed_membership_plans(session)
        tech = (
            await session.execute(select(Service).where(Service.slug == "tech-assistance"))
        ).scalar_one()
        service = tech
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
        
        # Membership — use Basic as the sample senior plan
        basic = (
            await session.execute(select(MembershipPlan).where(MembershipPlan.name == "Basic Membership"))
        ).scalar_one()
        membership = Membership(
            id=uuid.uuid4(),
            senior_id=senior_a.id,
            plan_id=basic.id,
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow(),
        )
        benefit = (
            await session.execute(
                select(MembershipBenefit).where(MembershipBenefit.plan_id == basic.id).limit(1)
            )
        ).scalar_one()
        session.add(membership)
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
