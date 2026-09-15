"""Ensure senior@example.com has family-app demo data (membership + orders)."""
from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timedelta

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.modules.care.models import CareManager
from app.modules.deliveries.models import DeliveryStatus, StaffDelivery
from app.modules.memberships.models import Membership, MembershipBenefit, MembershipPlan, MembershipUsageLedger
from app.modules.services.models import Service, ServiceRequest, ServiceRequestStatus
from app.modules.seniors.models import Senior
from app.modules.users.models import User

SENIOR_EMAIL = "senior@example.com"
DEMO_ADDRESS = "12.9716, 80.2201"  # Velachery coords for map home pin

ORDER_SPECS = [
    ("grocery", "Grocery", ServiceRequestStatus.IN_PROGRESS, DeliveryStatus.EN_ROUTE, "Weekly vegetables and milk"),
    ("food", "Food", ServiceRequestStatus.SCHEDULED, DeliveryStatus.PENDING, "Lunch — dal, rice, sabzi"),
    ("medicine", "Medicine", ServiceRequestStatus.CONFIRMED, DeliveryStatus.PENDING, "Blood pressure tablets refill"),
]


async def ensure_senior_demo_data() -> None:
    async with AsyncSessionLocal() as session:
        user = (await session.execute(select(User).where(User.email == SENIOR_EMAIL))).scalar_one_or_none()
        if not user:
            print(f"{SENIOR_EMAIL} not found — run main seed first.")
            return

        senior = (await session.execute(select(Senior).where(Senior.user_id == user.id))).scalar_one_or_none()
        if not senior:
            print("Senior profile missing.")
            return

        if not senior.address or senior.address.strip() in ("123", ""):
            senior.address = DEMO_ADDRESS
            print("Updated senior address to map coordinates.")

        plan = (
            await session.execute(select(MembershipPlan).where(MembershipPlan.name == "Single Membership"))
        ).scalar_one_or_none()
        if not plan:
            print("Single Membership plan missing — run seed.py first.")
            return

        now = datetime.utcnow()
        end = now + timedelta(days=30)
        membership = (
            await session.execute(select(Membership).where(Membership.senior_id == senior.id))
        ).scalar_one_or_none()
        if not membership:
            membership = Membership(
                id=uuid.uuid4(),
                senior_id=senior.id,
                plan_id=plan.id,
                start_date=now,
                end_date=end,
            )
            session.add(membership)
            await session.flush()
            print("Created active Single Membership (30 days).")
        else:
            membership.start_date = now
            membership.end_date = end
            membership.plan_id = plan.id
            print("Refreshed membership dates.")

        benefit = (
            await session.execute(
                select(MembershipBenefit).where(MembershipBenefit.plan_id == plan.id).limit(1)
            )
        ).scalar_one_or_none()
        if benefit:
            ledger = (
                await session.execute(
                    select(MembershipUsageLedger).where(MembershipUsageLedger.membership_id == membership.id)
                )
            ).scalar_one_or_none()
            if not ledger:
                session.add(
                    MembershipUsageLedger(
                        id=uuid.uuid4(),
                        membership_id=membership.id,
                        benefit_id=benefit.id,
                        used_amount=1,
                    )
                )
                print("Added membership usage ledger entry.")

        existing_requests = (
            await session.execute(select(ServiceRequest).where(ServiceRequest.senior_id == senior.id))
        ).scalars().all()
        request_by_slug: dict[str, ServiceRequest] = {}
        if existing_requests:
            print(f"Service requests already exist: {len(existing_requests)}")
            for req in existing_requests:
                service = (
                    await session.execute(select(Service).where(Service.id == req.service_id))
                ).scalar_one_or_none()
                if service and service.slug:
                    request_by_slug[service.slug] = req
        else:
            for slug, title, status, _delivery_status, notes in ORDER_SPECS:
                service = (
                    await session.execute(select(Service).where(Service.slug == slug))
                ).scalar_one_or_none()
                if not service:
                    print(f"Service slug {slug!r} missing — skipped.")
                    continue
                req = ServiceRequest(
                    id=uuid.uuid4(),
                    senior_id=senior.id,
                    service_id=service.id,
                    status=status,
                    notes=notes,
                )
                session.add(req)
                await session.flush()
                request_by_slug[slug] = req
            print(f"Created {len(request_by_slug)} demo service requests (grocery, food, medicine).")

        delivery_user = (
            await session.execute(select(User).where(User.email == "delivery@example.com"))
        ).scalar_one_or_none()
        delivery_cm = None
        if delivery_user:
            delivery_cm = (
                await session.execute(select(CareManager).where(CareManager.user_id == delivery_user.id))
            ).scalar_one_or_none()

        if delivery_cm:
            for slug, title, _req_status, delivery_status, _notes in ORDER_SPECS:
                req = request_by_slug.get(slug)
                if not req:
                    continue
                existing_delivery = (
                    await session.execute(
                        select(StaffDelivery).where(
                            StaffDelivery.senior_id == senior.id,
                            StaffDelivery.title == title,
                        )
                    )
                ).scalar_one_or_none()
                if existing_delivery:
                    existing_delivery.service_request_id = req.id
                    existing_delivery.status = delivery_status
                    existing_delivery.care_manager_id = delivery_cm.id
                    print(f"Linked delivery {title!r} to service request.")
                    continue
                session.add(
                    StaffDelivery(
                        id=uuid.uuid4(),
                        care_manager_id=delivery_cm.id,
                        senior_id=senior.id,
                        service_request_id=req.id,
                        title=title,
                        customer_name=f"John Doe",
                        location="Velachery, Chennai",
                        status=delivery_status,
                        scheduled_at=now,
                    )
                )
                print(f"Created linked delivery {title!r}.")
        else:
            print("delivery@example.com not found — skipped staff delivery linking.")

        await session.commit()
        print("Senior demo data ready.")


if __name__ == "__main__":
    asyncio.run(ensure_senior_demo_data())
