"""Idempotent development seed for Health read APIs (Senior A only)."""

import asyncio
from datetime import datetime

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.modules.healthcare.models import (
    HealthDocument,
    HealthcareProvider,
    LabResult,
    MedicalRecord,
    Medication,
    MedicationSchedule,
)
from app.modules.seniors.models import Senior
from app.modules.users.models import User

DEV_DOC_PREFIX = "https://example.com/dev/agewell/"
SENIOR_EMAIL = "senior@example.com"


async def _get_or_create_provider(session, name: str, specialty: str) -> HealthcareProvider:
    existing = (
        await session.execute(select(HealthcareProvider).where(HealthcareProvider.name == name))
    ).scalar_one_or_none()
    if existing:
        return existing
    provider = HealthcareProvider(name=name, specialty=specialty)
    session.add(provider)
    await session.commit()
    await session.refresh(provider)
    return provider


async def seed_health_dev_data() -> None:
    async with AsyncSessionLocal() as session:
        user = (
            await session.execute(select(User).where(User.email == SENIOR_EMAIL))
        ).scalar_one_or_none()
        if not user:
            print("Health seed skipped: senior@example.com not found.")
            return

        senior = (
            await session.execute(select(Senior).where(Senior.user_id == user.id))
        ).scalar_one_or_none()
        if not senior:
            print("Health seed skipped: Senior A profile not found.")
            return

        cardiologist = await _get_or_create_provider(session, "Dr. Smith", "Cardiology")
        endocrinologist = await _get_or_create_provider(session, "Dr. Patel", "Endocrinology")

        aspirin = (
            await session.execute(
                select(Medication).where(
                    Medication.senior_id == senior.id,
                    Medication.name == "Aspirin",
                )
            )
        ).scalar_one_or_none()
        if aspirin:
            evening = (
                await session.execute(
                    select(MedicationSchedule).where(
                        MedicationSchedule.medication_id == aspirin.id,
                        MedicationSchedule.schedule_time == "20:00",
                    )
                )
            ).scalar_one_or_none()
            if not evening:
                session.add(
                    MedicationSchedule(
                        medication_id=aspirin.id,
                        schedule_time="20:00",
                        frequency="Daily",
                    )
                )

        already_seeded = (
            await session.execute(
                select(HealthDocument.id).where(
                    HealthDocument.senior_id == senior.id,
                    HealthDocument.file_url.startswith(DEV_DOC_PREFIX),
                )
            )
        ).first()
        if already_seeded:
            await session.commit()
            print("Health development seed already present for Senior A.")
            return

        session.add_all(
            [
                MedicalRecord(
                    senior_id=senior.id,
                    provider_id=cardiologist.id,
                    notes="Follow-up for hypertension. Blood pressure remains stable on current medication.",
                ),
                MedicalRecord(
                    senior_id=senior.id,
                    provider_id=endocrinologist.id,
                    notes="Type 2 diabetes review. Continue current diet and medication plan.",
                ),
                LabResult(
                    senior_id=senior.id,
                    test_name="HbA1c",
                    result_value="6.8%",
                    date=datetime(2026, 7, 15, 9, 0),
                ),
                LabResult(
                    senior_id=senior.id,
                    test_name="CBC",
                    result_value="Within expected range",
                    date=datetime(2026, 8, 1, 10, 30),
                ),
                LabResult(
                    senior_id=senior.id,
                    test_name="Lipid Panel",
                    result_value="LDL 110 mg/dL",
                    date=datetime(2026, 8, 1, 10, 30),
                ),
                HealthDocument(
                    senior_id=senior.id,
                    file_url=f"{DEV_DOC_PREFIX}john-doe-hba1c-2026-07.pdf",
                    document_type="Lab Report",
                ),
                HealthDocument(
                    senior_id=senior.id,
                    file_url=f"{DEV_DOC_PREFIX}john-doe-prescription-2026-08.pdf",
                    document_type="Prescription",
                ),
            ]
        )
        await session.commit()
        print("Health development seed created for Senior A.")


if __name__ == "__main__":
    asyncio.run(seed_health_dev_data())
