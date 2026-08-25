import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.future import select

from app.db.session import AsyncSessionLocal
from app.main import app
from app.modules.access.models import FamilySeniorAccess
from app.modules.emergency.models import EmergencyEvent
from app.modules.families.models import FamilyMember
from app.modules.memberships.models import MembershipUsageLedger
from app.modules.seniors.models import Senior
from app.modules.visits.models import VisitReport


@pytest.mark.asyncio
async def test_api_database_connection():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")
        assert response.status_code == 200


@pytest.mark.asyncio
async def test_authorization_enforcement():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(FamilyMember).limit(1))
        family = result.scalars().first()
        result = await session.execute(select(Senior))
        seniors = result.scalars().all()
        senior_a, senior_b = seniors[0], seniors[1]

        stmt = select(FamilySeniorAccess).where(
            FamilySeniorAccess.family_id == family.id,
            FamilySeniorAccess.senior_id == senior_a.id,
        )
        if not (await session.execute(stmt)).scalars().first():
            raise Exception("FAIL")

        stmt2 = select(FamilySeniorAccess).where(
            FamilySeniorAccess.family_id == family.id,
            FamilySeniorAccess.senior_id == senior_b.id,
        )
        if (await session.execute(stmt2)).scalars().first():
            raise Exception("FAIL")


@pytest.mark.asyncio
async def test_membership_usage_persists():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(MembershipUsageLedger))
        ledger = result.scalars().first()
        assert ledger.used_amount == 1


@pytest.mark.asyncio
async def test_emergency_transitions():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(EmergencyEvent))
        assert len(result.scalars().all()) >= 1


@pytest.mark.asyncio
async def test_visit_relationships():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(VisitReport))
        assert result.scalars().first().issues_noted == "None"
