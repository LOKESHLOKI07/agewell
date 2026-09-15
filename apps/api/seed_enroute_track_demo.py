"""Seed an EN_ROUTE grocery delivery with a live executive location pin for senior tracking demo."""
from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timedelta

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.modules.care.models import CareManager
from app.modules.deliveries.models import DeliveryStatus, StaffDelivery
from app.modules.seniors.models import Senior
from app.modules.services.models import Service, ServiceRequest, ServiceRequestStatus
from app.modules.tracking.models import LocationPoint, LocationSession
from app.modules.users.models import User

SENIOR_EMAIL = "senior@example.com"
DELIVERY_EMAIL = "delivery@example.com"

# Near Velachery senior home (12.9716, 80.2201) — slightly south so map shows movement toward home.
DEMO_EXEC_LAT = "12.96820"
DEMO_EXEC_LNG = "80.22180"
SENIOR_HOME = "12.9716, 80.2201"


async def seed_enroute_track_demo() -> None:
    async with AsyncSessionLocal() as session:
        senior_user = (
            await session.execute(select(User).where(User.email == SENIOR_EMAIL))
        ).scalar_one_or_none()
        delivery_user = (
            await session.execute(select(User).where(User.email == DELIVERY_EMAIL))
        ).scalar_one_or_none()
        if not senior_user or not delivery_user:
            print("Need senior@example.com and delivery@example.com in DB.")
            return

        senior = (
            await session.execute(select(Senior).where(Senior.user_id == senior_user.id))
        ).scalar_one()
        if not senior.address or senior.address.strip() in ("123", ""):
            senior.address = SENIOR_HOME

        cm = (
            await session.execute(select(CareManager).where(CareManager.user_id == delivery_user.id))
        ).scalar_one()

        grocery_service = (
            await session.execute(select(Service).where(Service.slug == "grocery"))
        ).scalar_one_or_none()
        if not grocery_service:
            print("grocery service missing")
            return

        req = (
            await session.execute(
                select(ServiceRequest).where(
                    ServiceRequest.senior_id == senior.id,
                    ServiceRequest.service_id == grocery_service.id,
                )
            )
        ).scalar_one_or_none()
        if not req:
            req = ServiceRequest(
                id=uuid.uuid4(),
                senior_id=senior.id,
                service_id=grocery_service.id,
                status=ServiceRequestStatus.IN_PROGRESS,
                notes="Demo grocery — track on map",
            )
            session.add(req)
            await session.flush()
            print("Created grocery service request")
        else:
            req.status = ServiceRequestStatus.IN_PROGRESS
            req.notes = "Demo grocery — track on map"

        delivery = (
            await session.execute(
                select(StaffDelivery).where(
                    StaffDelivery.senior_id == senior.id,
                    StaffDelivery.title == "Grocery",
                )
            )
        ).scalar_one_or_none()
        now = datetime.utcnow()
        if not delivery:
            delivery = StaffDelivery(
                id=uuid.uuid4(),
                care_manager_id=cm.id,
                senior_id=senior.id,
                service_request_id=req.id,
                title="Grocery",
                customer_name="John Doe",
                location="Velachery, Chennai",
                status=DeliveryStatus.EN_ROUTE,
                scheduled_at=now,
            )
            session.add(delivery)
            print("Created Grocery EN_ROUTE delivery")
        else:
            delivery.care_manager_id = cm.id
            delivery.service_request_id = req.id
            delivery.status = DeliveryStatus.EN_ROUTE
            delivery.scheduled_at = now
            delivery.location = "Velachery, Chennai — en route"
            delivery.customer_name = delivery.customer_name or "John Doe"
            print(f"Set Grocery delivery EN_ROUTE id={delivery.id}")

        loc_session = (
            await session.execute(
                select(LocationSession)
                .where(LocationSession.user_id == delivery_user.id)
                .order_by(LocationSession.id.desc())
                .limit(1)
            )
        ).scalar_one_or_none()
        if not loc_session:
            loc_session = LocationSession(id=uuid.uuid4(), user_id=delivery_user.id)
            session.add(loc_session)
            await session.flush()
            print(f"Created location session {loc_session.id}")
        else:
            print(f"Using location session {loc_session.id}")

        # Fresh pin so senior map shows LIVE (not stale)
        point = LocationPoint(
            id=uuid.uuid4(),
            session_id=loc_session.id,
            latitude=DEMO_EXEC_LAT,
            longitude=DEMO_EXEC_LNG,
            timestamp=now,
        )
        session.add(point)
        # Optional trail points (slightly older) along approach to home
        for i, (lat, lng) in enumerate(
            [
                ("12.96510", "80.22350"),
                ("12.96660", "80.22260"),
                ("12.96740", "80.22220"),
            ]
        ):
            session.add(
                LocationPoint(
                    id=uuid.uuid4(),
                    session_id=loc_session.id,
                    latitude=lat,
                    longitude=lng,
                    timestamp=now - timedelta(minutes=3 - i),
                )
            )

        await session.commit()
        print("EN_ROUTE demo ready.")
        print(f"  delivery_id={delivery.id}")
        print(f"  executive pin={DEMO_EXEC_LAT}, {DEMO_EXEC_LNG}")
        print("  Senior: Orders -> Grocery -> Track live")


if __name__ == "__main__":
    asyncio.run(seed_enroute_track_demo())
