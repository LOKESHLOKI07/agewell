"""Apply missing staff-ops schema + seed mock assignments for Care demo."""

from __future__ import annotations

import asyncio
import uuid
from datetime import date, datetime, timezone

from sqlalchemy import select, text

from app.core.security import get_password_hash
from app.db.session import AsyncSessionLocal, engine
from app.modules.attendance.models import StaffAttendance  # noqa: F401
from app.modules.care.models import CareManager
from app.modules.deliveries.models import DeliveryStatus, StaffDelivery
from app.modules.seniors.models import Senior
from app.modules.training.models import (  # noqa: F401
    StaffDocument,
    StaffTrainingProgress,
    TrainingModule,
    TrainingStatus,
)
from app.modules.users.models import AccountStatus, RoleEnum, User
from app.modules.visits.models import Visit, VisitStatus, VisitTask


async def ensure_schema() -> None:
    async with engine.begin() as conn:
        await conn.execute(
            text(
                """
                DO $$ BEGIN
                    CREATE TYPE deliverystatus AS ENUM ('PENDING', 'EN_ROUTE', 'COMPLETED', 'FAILED');
                EXCEPTION WHEN duplicate_object THEN NULL;
                END $$;
                """
            )
        )
        await conn.execute(
            text(
                """
                DO $$ BEGIN
                    CREATE TYPE trainingstatus AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
                EXCEPTION WHEN duplicate_object THEN NULL;
                END $$;
                """
            )
        )
        await conn.execute(
            text(
                """
                ALTER TABLE visits
                ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL;
                """
            )
        )
        await conn.execute(
            text(
                """
                ALTER TABLE visits
                ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;
                """
            )
        )
        await conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS staff_attendance (
                    id UUID PRIMARY KEY,
                    care_manager_id UUID NOT NULL REFERENCES care_managers(id),
                    check_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                    check_out_at TIMESTAMPTZ NULL,
                    location VARCHAR NULL,
                    created_at TIMESTAMPTZ DEFAULT now()
                );
                """
            )
        )
        await conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_staff_attendance_care_manager_id ON staff_attendance (care_manager_id);"
            )
        )
        await conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS staff_deliveries (
                    id UUID PRIMARY KEY,
                    care_manager_id UUID NOT NULL REFERENCES care_managers(id),
                    senior_id UUID NULL REFERENCES seniors(id),
                    title VARCHAR NOT NULL,
                    customer_name VARCHAR NULL,
                    location VARCHAR NULL,
                    status deliverystatus NOT NULL,
                    scheduled_at TIMESTAMPTZ NULL,
                    created_at TIMESTAMPTZ DEFAULT now()
                );
                """
            )
        )
        await conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_staff_deliveries_care_manager_id ON staff_deliveries (care_manager_id);"
            )
        )
        await conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS training_modules (
                    id UUID PRIMARY KEY,
                    title VARCHAR NOT NULL,
                    sort_order VARCHAR NULL,
                    created_at TIMESTAMPTZ DEFAULT now()
                );
                """
            )
        )
        await conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS staff_training_progress (
                    id UUID PRIMARY KEY,
                    care_manager_id UUID NOT NULL REFERENCES care_managers(id),
                    module_id UUID NOT NULL REFERENCES training_modules(id),
                    status trainingstatus NOT NULL,
                    updated_at TIMESTAMPTZ DEFAULT now()
                );
                """
            )
        )
        await conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_staff_training_progress_care_manager_id ON staff_training_progress (care_manager_id);"
            )
        )
        await conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS staff_documents (
                    id UUID PRIMARY KEY,
                    care_manager_id UUID NOT NULL REFERENCES care_managers(id),
                    title VARCHAR NOT NULL,
                    verified VARCHAR NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT now()
                );
                """
            )
        )
        await conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_staff_documents_care_manager_id ON staff_documents (care_manager_id);"
            )
        )
        # stamp alembic if possible
        try:
            await conn.execute(
                text(
                    """
                    UPDATE alembic_version SET version_num = 'a1b2c3d4e5f6'
                    WHERE version_num = 'f8a2b3c4d567';
                    """
                )
            )
        except Exception as exc:  # noqa: BLE001
            print("alembic stamp skipped:", exc)


async def get_or_create_senior(session) -> Senior:
    user = (await session.execute(select(User).where(User.email == "senior@example.com"))).scalar_one_or_none()
    if not user:
        user = User(
            id=uuid.uuid4(),
            email="senior@example.com",
            phone="111",
            role=RoleEnum.SENIOR,
            hashed_password=get_password_hash("password123"),
            account_status=AccountStatus.ACTIVE,
        )
        session.add(user)
        await session.flush()
        print("Created senior@example.com")
    senior = (await session.execute(select(Senior).where(Senior.user_id == user.id))).scalar_one_or_none()
    if not senior:
        senior = Senior(
            id=uuid.uuid4(),
            user_id=user.id,
            first_name="John",
            last_name="Doe",
            date_of_birth=date(1940, 1, 1),
            address="12.9716, 80.2201",
            emergency_contact="911",
        )
        session.add(senior)
        await session.flush()
        print("Created Senior John Doe")
    return senior


async def care_by_email(session, email: str) -> CareManager:
    user = (await session.execute(select(User).where(User.email == email))).scalar_one()
    return (await session.execute(select(CareManager).where(CareManager.user_id == user.id))).scalar_one()


async def ensure_visit(session, *, senior: Senior, cm: CareManager, notes: str, tasks: list[str]) -> Visit:
    existing = (
        await session.execute(
            select(Visit).where(Visit.care_manager_id == cm.id, Visit.senior_id == senior.id).limit(1)
        )
    ).scalar_one_or_none()
    if existing:
        existing.notes = notes
        existing.status = VisitStatus.SCHEDULED
        existing.scheduled_at = datetime.now(timezone.utc)
        print(f"Updated visit for {cm.employee_id}")
        return existing

    visit = Visit(
        id=uuid.uuid4(),
        senior_id=senior.id,
        care_manager_id=cm.id,
        status=VisitStatus.SCHEDULED,
        scheduled_at=datetime.now(timezone.utc),
        notes=notes,
    )
    session.add(visit)
    await session.flush()
    for name in tasks:
        session.add(VisitTask(id=uuid.uuid4(), visit_id=visit.id, task_name=name, is_completed=False))
    print(f"Created visit for {cm.employee_id} -> senior {senior.first_name}")
    return visit


async def ensure_deliveries(session, *, delivery_cm: CareManager, senior: Senior) -> None:
    existing = (
        await session.execute(select(StaffDelivery).where(StaffDelivery.care_manager_id == delivery_cm.id))
    ).scalars().all()
    if existing:
        print(f"Deliveries already exist: {len(existing)}")
        return
    rows = [
        StaffDelivery(
            id=uuid.uuid4(),
            care_manager_id=delivery_cm.id,
            senior_id=senior.id,
            title="Grocery",
            customer_name="Mrs. Shah / John Doe",
            location="Kandivali West",
            status=DeliveryStatus.EN_ROUTE,
            scheduled_at=datetime.now(timezone.utc),
        ),
        StaffDelivery(
            id=uuid.uuid4(),
            care_manager_id=delivery_cm.id,
            senior_id=senior.id,
            title="Food",
            customer_name="Mr. Patil / John Doe",
            location="Borivali East",
            status=DeliveryStatus.PENDING,
            scheduled_at=datetime.now(timezone.utc),
        ),
        StaffDelivery(
            id=uuid.uuid4(),
            care_manager_id=delivery_cm.id,
            senior_id=senior.id,
            title="Medicine",
            customer_name="John Doe",
            location="Kandivali West",
            status=DeliveryStatus.PENDING,
            scheduled_at=datetime.now(timezone.utc),
        ),
    ]
    session.add_all(rows)
    print(f"Created {len(rows)} deliveries (Grocery/Food/Medicine)")


async def ensure_training(session, companion: CareManager) -> None:
    modules = (await session.execute(select(TrainingModule))).scalars().all()
    if not modules:
        modules = [
            TrainingModule(id=uuid.uuid4(), title="Elderly Care Basics"),
            TrainingModule(id=uuid.uuid4(), title="First Aid Training"),
            TrainingModule(id=uuid.uuid4(), title="Emergency Response"),
            TrainingModule(id=uuid.uuid4(), title="Customer Privacy"),
        ]
        session.add_all(modules)
        await session.flush()
        print("Created training modules")
    progress = (
        await session.execute(select(StaffTrainingProgress).where(StaffTrainingProgress.care_manager_id == companion.id))
    ).scalars().all()
    if not progress:
        session.add_all(
            [
                StaffTrainingProgress(
                    id=uuid.uuid4(),
                    care_manager_id=companion.id,
                    module_id=modules[0].id,
                    status=TrainingStatus.COMPLETED,
                ),
                StaffTrainingProgress(
                    id=uuid.uuid4(),
                    care_manager_id=companion.id,
                    module_id=modules[1].id,
                    status=TrainingStatus.COMPLETED,
                ),
                StaffTrainingProgress(
                    id=uuid.uuid4(),
                    care_manager_id=companion.id,
                    module_id=modules[2].id,
                    status=TrainingStatus.IN_PROGRESS,
                ),
            ]
        )
        print("Created companion training progress")
    docs = (await session.execute(select(StaffDocument).where(StaffDocument.care_manager_id == companion.id))).scalars().all()
    if not docs:
        session.add(
            StaffDocument(id=uuid.uuid4(), care_manager_id=companion.id, title="Aadhaar Card", verified="VERIFIED")
        )
        print("Created companion document")


async def main() -> None:
    await ensure_schema()
    async with AsyncSessionLocal() as session:
        senior = await get_or_create_senior(session)
        care = await care_by_email(session, "care@example.com")
        companion = await care_by_email(session, "companion@example.com")
        delivery = await care_by_email(session, "delivery@example.com")

        await ensure_visit(
            session,
            senior=senior,
            cm=care,
            notes="Kandivali West",
            tasks=["Check vitals", "Medication Reminder", "General Meetup"],
        )
        await ensure_visit(
            session,
            senior=senior,
            cm=companion,
            notes="Kandivali West",
            tasks=["Medication Reminder", "Walking Assistance", "Digital Assistance", "General Meetup"],
        )
        await ensure_deliveries(session, delivery_cm=delivery, senior=senior)
        await ensure_training(session, companion)
        await session.commit()
        print("MOCK SEED DONE")
        print(f"Senior id={senior.id} name={senior.first_name} {senior.last_name}")
        print(f"Care CM={care.id} Companion CM={companion.id} Delivery CM={delivery.id}")


if __name__ == "__main__":
    asyncio.run(main())
