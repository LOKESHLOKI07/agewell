"""Phase 1 credit accounts: allocation, expenses, and admin deductions."""

from __future__ import annotations

import asyncio
import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app

ADMIN_EMAIL = "admin@example.com"
PASSWORD = "password123"


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


async def login(client: AsyncClient, email: str) -> str:
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": PASSWORD},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def unique_email(prefix: str) -> str:
    return f"{prefix}.{uuid.uuid4().hex[:10]}@example.com"


def unique_phone() -> str:
    return f"9{uuid.uuid4().int % 10**9:09d}"


def onboarding_payload(**overrides):
    body = {
        "family_contact_1_name": "Asha Sharma",
        "family_contact_1_phone": "9876543210",
        "family_contact_2_name": "Rohit Sharma",
        "family_contact_2_phone": "9876501234",
        "emergency_contact_name": "Neha Sharma",
        "emergency_contact_phone": "9988776655",
    }
    body.update(overrides)
    return body


async def register_senior(client: AsyncClient, email: str) -> str:
    response = await client.post(
        "/api/v1/auth/register/senior",
        json={
            "first_name": "Credit",
            "last_name": "Tester",
            "email": email,
            "phone": unique_phone(),
            "password": PASSWORD,
            "date_of_birth": "1952-03-10",
            "address": "Borivali West",
            "emergency_contact": "9876543210",
        },
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


async def provision_care(client: AsyncClient, admin_headers: dict) -> dict:
    email = unique_email("credit-care")
    created = await client.post(
        "/api/v1/care/provision",
        headers=admin_headers,
        json={
            "email": email,
            "phone": unique_phone(),
            "password": PASSWORD,
            "first_name": "Credit",
            "last_name": "Companion",
            "employee_id": f"CR-{uuid.uuid4().hex[:6].upper()}",
            "staff_kind": "COMPANION",
            "status": "ACTIVE",
        },
    )
    assert created.status_code == 200, created.text
    return auth_header(await login(client, email))


async def activate_membership(client: AsyncClient, senior_headers: dict, admin_headers: dict) -> str:
    created = await client.post(
        "/api/v1/memberships/requests",
        headers=senior_headers,
        json=onboarding_payload(plan_key="single"),
    )
    assert created.status_code == 200, created.text
    request_id = created.json()["id"]
    accepted = await client.patch(
        f"/api/v1/memberships/requests/{request_id}",
        headers=admin_headers,
        json={"status": "APPROVED"},
    )
    assert accepted.status_code == 200, accepted.text
    paid = await client.post(
        f"/api/v1/memberships/requests/{request_id}/pay",
        headers=senior_headers,
    )
    assert paid.status_code == 200, paid.text
    return request_id


async def service_id_by_slug(client: AsyncClient, headers: dict, slug: str) -> str:
    listed = await client.get("/api/v1/services/", headers=headers)
    assert listed.status_code == 200, listed.text
    match = next((item for item in listed.json() if item.get("slug") == slug), None)
    assert match is not None, f"Missing service {slug}"
    return match["id"]


async def create_request(client: AsyncClient, headers: dict, senior_id: str, slug: str) -> str:
    service_id = await service_id_by_slug(client, headers, slug)
    created = await client.post(
        "/api/v1/services/requests",
        headers=headers,
        json={"senior_id": senior_id, "service_id": service_id, "notes": f"{slug} credit test"},
    )
    assert created.status_code == 200, created.text
    return created.json()["id"]


@pytest.mark.asyncio
async def test_initial_credits_allocated_once_on_activation(client):
    senior = auth_header(await register_senior(client, unique_email("credit-alloc")))
    admin = auth_header(await login(client, ADMIN_EMAIL))

    before = await client.get("/api/v1/credits/balances", headers=senior)
    assert before.status_code == 200, before.text
    assert before.json()["service"]["allocated_amount"] == 0

    await activate_membership(client, senior, admin)

    balances = await client.get("/api/v1/credits/balances", headers=senior)
    assert balances.status_code == 200, balances.text
    body = balances.json()
    assert body["service"]["allocated_amount"] == 2500
    assert body["service"]["available_balance"] == 2500
    assert body["service"]["spent_amount"] == 0
    assert body["emergency"]["allocated_amount"] == 15000
    assert body["emergency"]["available_balance"] == 15000

    history = await client.get("/api/v1/credits/transactions", headers=senior)
    assert history.status_code == 200, history.text
    types = {item["transaction_type"] for item in history.json()["items"]}
    assert types == {"ALLOCATION"}
    assert history.json()["total"] == 2


@pytest.mark.asyncio
async def test_pay_retry_does_not_duplicate_allocation(client):
    senior = auth_header(await register_senior(client, unique_email("credit-retry")))
    admin = auth_header(await login(client, ADMIN_EMAIL))
    request_id = await activate_membership(client, senior, admin)

    again = await client.post(f"/api/v1/memberships/requests/{request_id}/pay", headers=senior)
    assert again.status_code == 409

    history = await client.get("/api/v1/credits/transactions", headers=senior)
    assert history.status_code == 200
    assert history.json()["total"] == 2
    balances = (await client.get("/api/v1/credits/balances", headers=senior)).json()
    assert balances["service"]["available_balance"] == 2500
    assert balances["emergency"]["available_balance"] == 15000


@pytest.mark.asyncio
async def test_renewal_does_not_refill_credits(client):
    senior = auth_header(await register_senior(client, unique_email("credit-renew")))
    admin = auth_header(await login(client, ADMIN_EMAIL))
    await activate_membership(client, senior, admin)

    current = (await client.get("/api/v1/memberships/current", headers=senior)).json()
    request_id = (
        await client.get("/api/v1/memberships/requests", headers=senior, params={"status": "APPROVED"})
    ).json()["items"][0]["id"]
    rejected = await client.patch(
        f"/api/v1/memberships/requests/{request_id}",
        headers=admin,
        json={"status": "REJECTED"},
    )
    assert rejected.status_code == 200, rejected.text
    assert (await client.get("/api/v1/memberships/current", headers=senior)).status_code == 404

    await activate_membership(client, senior, admin)
    assert (await client.get("/api/v1/memberships/current", headers=senior)).status_code == 200
    assert current["membership_id"]
    balances = (await client.get("/api/v1/credits/balances", headers=senior)).json()
    assert balances["service"]["allocated_amount"] == 2500
    assert balances["service"]["available_balance"] == 2500
    history = (await client.get("/api/v1/credits/transactions", headers=senior)).json()
    assert history["total"] == 2


@pytest.mark.asyncio
async def test_service_and_emergency_deduction_after_admin_approval(client):
    senior_token = await register_senior(client, unique_email("credit-deduct"))
    senior = auth_header(senior_token)
    admin = auth_header(await login(client, ADMIN_EMAIL))
    care = await provision_care(client, admin)
    me = (await client.get("/api/v1/seniors/me", headers=senior)).json()
    await activate_membership(client, senior, admin)

    grocery_id = await create_request(client, senior, me["id"], "grocery")
    sos_id = await create_request(client, senior, me["id"], "emergency-sos")

    grocery_expense = await client.post(
        "/api/v1/credits/expenses",
        headers=care,
        json={"service_request_id": grocery_id, "amount": 350, "description": "Grocery & Shopping"},
    )
    assert grocery_expense.status_code == 200, grocery_expense.text
    assert grocery_expense.json()["status"] == "PENDING"
    assert grocery_expense.json()["category"] == "SERVICE"

    admin_inbox = await client.get(
        "/api/v1/notifications/",
        headers=admin,
        params={"limit": 20, "offset": 0},
    )
    assert admin_inbox.status_code == 200, admin_inbox.text
    expense_notes = [
        item
        for item in admin_inbox.json()["items"]
        if item.get("title") == "Expense approval needed" and "Grocery & Shopping" in (item.get("message") or "")
    ]
    assert expense_notes, admin_inbox.text
    assert "₹350" in expense_notes[0]["message"]
    assert "Submitted by Credit Companion (Companion)" in expense_notes[0]["message"]
    assert expense_notes[0]["priority"] == "IMPORTANT"
    assert expense_notes[0].get("action_ref") == f"expense:{grocery_expense.json()['id']}"

    admin_ops = await client.get(
        "/api/v1/notifications/admin",
        headers=admin,
        params={"limit": 20, "offset": 0, "is_read": "false"},
    )
    assert admin_ops.status_code == 200, admin_ops.text
    ops_expense = next(
        (
            item
            for item in admin_ops.json()["items"]
            if item.get("title") == "Expense approval needed" and "Grocery & Shopping" in (item.get("message") or "")
        ),
        None,
    )
    assert ops_expense is not None, admin_ops.text
    assert ops_expense.get("user_email")

    pending_balances = (await client.get("/api/v1/credits/balances", headers=senior)).json()
    assert pending_balances["service"]["available_balance"] == 2500

    approved = await client.post(
        f"/api/v1/credits/expenses/{grocery_expense.json()['id']}/approve",
        headers=admin,
    )
    assert approved.status_code == 200, approved.text
    assert approved.json()["status"] == "APPROVED"

    after_service = (await client.get("/api/v1/credits/balances", headers=senior)).json()
    assert after_service["service"]["available_balance"] == 2150
    assert after_service["service"]["spent_amount"] == 350
    assert after_service["emergency"]["available_balance"] == 15000

    emergency_expense = await client.post(
        "/api/v1/credits/expenses",
        headers=care,
        json={"service_request_id": sos_id, "amount": 3000, "description": "Emergency Ambulance"},
    )
    assert emergency_expense.status_code == 200, emergency_expense.text
    assert emergency_expense.json()["category"] == "EMERGENCY"
    approved_emg = await client.post(
        f"/api/v1/credits/expenses/{emergency_expense.json()['id']}/approve",
        headers=admin,
    )
    assert approved_emg.status_code == 200, approved_emg.text

    after = (await client.get("/api/v1/credits/balances", headers=senior)).json()
    assert after["emergency"]["available_balance"] == 12000
    assert after["emergency"]["spent_amount"] == 3000
    assert after["service"]["available_balance"] == 2150
    assert after["total_spent_amount"] == 3350

    history = (await client.get("/api/v1/credits/transactions", headers=senior)).json()
    deductions = [item for item in history["items"] if item["transaction_type"] == "DEDUCTION"]
    assert len(deductions) == 2
    assert {item["category"] for item in deductions} == {"SERVICE", "EMERGENCY"}


@pytest.mark.asyncio
async def test_rejected_expense_does_not_deduct(client):
    senior = auth_header(await register_senior(client, unique_email("credit-reject")))
    admin = auth_header(await login(client, ADMIN_EMAIL))
    care = await provision_care(client, admin)
    me = (await client.get("/api/v1/seniors/me", headers=senior)).json()
    await activate_membership(client, senior, admin)
    request_id = await create_request(client, senior, me["id"], "doctor")

    expense = await client.post(
        "/api/v1/credits/expenses",
        headers=care,
        json={"service_request_id": request_id, "amount": 500, "description": "Doctor visit"},
    )
    assert expense.status_code == 200, expense.text
    rejected = await client.post(
        f"/api/v1/credits/expenses/{expense.json()['id']}/reject",
        headers=admin,
        json={"reason": "Receipt unclear"},
    )
    assert rejected.status_code == 200, rejected.text
    assert rejected.json()["status"] == "REJECTED"
    balances = (await client.get("/api/v1/credits/balances", headers=senior)).json()
    assert balances["service"]["available_balance"] == 2500


@pytest.mark.asyncio
async def test_duplicate_approval_and_insufficient_balance(client):
    senior = auth_header(await register_senior(client, unique_email("credit-guard")))
    admin = auth_header(await login(client, ADMIN_EMAIL))
    care = await provision_care(client, admin)
    me = (await client.get("/api/v1/seniors/me", headers=senior)).json()
    await activate_membership(client, senior, admin)
    first_id = await create_request(client, senior, me["id"], "grocery")
    second_id = await create_request(client, senior, me["id"], "companion")

    first = await client.post(
        "/api/v1/credits/expenses",
        headers=care,
        json={"service_request_id": first_id, "amount": 2000, "description": "Grocery"},
    )
    assert first.status_code == 200, first.text
    approved = await client.post(
        f"/api/v1/credits/expenses/{first.json()['id']}/approve",
        headers=admin,
    )
    assert approved.status_code == 200, approved.text
    again = await client.post(
        f"/api/v1/credits/expenses/{first.json()['id']}/approve",
        headers=admin,
    )
    assert again.status_code == 409

    oversized = await client.post(
        "/api/v1/credits/expenses",
        headers=care,
        json={"service_request_id": second_id, "amount": 800, "description": "Companion visit"},
    )
    assert oversized.status_code == 200, oversized.text
    failed = await client.post(
        f"/api/v1/credits/expenses/{oversized.json()['id']}/approve",
        headers=admin,
    )
    assert failed.status_code == 409
    assert "Insufficient" in failed.json()["detail"]
    balances = (await client.get("/api/v1/credits/balances", headers=senior)).json()
    assert balances["service"]["available_balance"] == 500


@pytest.mark.asyncio
async def test_admin_records_actual_amount_and_member_balance_updates(client):
    senior = auth_header(await register_senior(client, unique_email("credit-record")))
    admin = auth_header(await login(client, ADMIN_EMAIL))
    me = (await client.get("/api/v1/seniors/me", headers=senior)).json()
    await activate_membership(client, senior, admin)

    forbidden = await client.post(
        "/api/v1/credits/expenses/record",
        headers=senior,
        json={"senior_id": me["id"], "amount": 350, "description": "Grocery & Shopping", "category": "SERVICE"},
    )
    assert forbidden.status_code == 403

    recorded = await client.post(
        "/api/v1/credits/expenses/record",
        headers=admin,
        json={"senior_id": me["id"], "amount": 350, "description": "Grocery & Shopping", "category": "SERVICE"},
    )
    assert recorded.status_code == 200, recorded.text
    assert recorded.json()["status"] == "APPROVED"
    assert recorded.json()["description"] == "Grocery & Shopping"

    balances = (await client.get("/api/v1/credits/balances", headers=senior)).json()
    assert balances["service"]["available_balance"] == 2150
    assert balances["service"]["spent_amount"] == 350
    assert balances["emergency"]["available_balance"] == 15000

    history = (await client.get("/api/v1/credits/transactions", headers=senior)).json()
    deductions = [item for item in history["items"] if item["transaction_type"] == "DEDUCTION"]
    assert len(deductions) == 1
    assert deductions[0]["description"] == "Grocery & Shopping"

    oversized = await client.post(
        "/api/v1/credits/expenses/record",
        headers=admin,
        json={"senior_id": me["id"], "amount": 3000, "description": "Bulk grocery", "category": "SERVICE"},
    )
    assert oversized.status_code == 409
    assert (await client.get("/api/v1/credits/balances", headers=senior)).json()["service"]["available_balance"] == 2150


@pytest.mark.asyncio
async def test_authorization_for_admin_and_provider_actions(client):
    senior = auth_header(await register_senior(client, unique_email("credit-auth")))
    admin = auth_header(await login(client, ADMIN_EMAIL))
    care = await provision_care(client, admin)
    me = (await client.get("/api/v1/seniors/me", headers=senior)).json()
    await activate_membership(client, senior, admin)
    request_id = await create_request(client, senior, me["id"], "grocery")

    forbidden_submit = await client.post(
        "/api/v1/credits/expenses",
        headers=senior,
        json={"service_request_id": request_id, "amount": 100},
    )
    assert forbidden_submit.status_code == 403

    expense = await client.post(
        "/api/v1/credits/expenses",
        headers=care,
        json={"service_request_id": request_id, "amount": 100, "description": "Grocery"},
    )
    assert expense.status_code == 200, expense.text
    care_approve = await client.post(
        f"/api/v1/credits/expenses/{expense.json()['id']}/approve",
        headers=care,
    )
    assert care_approve.status_code == 403
    balances = (await client.get("/api/v1/credits/balances", headers=senior)).json()
    assert balances["service"]["available_balance"] == 2500


@pytest.mark.asyncio
async def test_concurrent_approvals_never_go_negative(client):
    senior = auth_header(await register_senior(client, unique_email("credit-race")))
    admin = auth_header(await login(client, ADMIN_EMAIL))
    care = await provision_care(client, admin)
    me = (await client.get("/api/v1/seniors/me", headers=senior)).json()
    await activate_membership(client, senior, admin)
    first_id = await create_request(client, senior, me["id"], "grocery")
    second_id = await create_request(client, senior, me["id"], "companion")

    first = await client.post(
        "/api/v1/credits/expenses",
        headers=care,
        json={"service_request_id": first_id, "amount": 2000, "description": "Grocery"},
    )
    second = await client.post(
        "/api/v1/credits/expenses",
        headers=care,
        json={"service_request_id": second_id, "amount": 2000, "description": "Companion"},
    )
    assert first.status_code == 200, first.text
    assert second.status_code == 200, second.text

    results = await asyncio.gather(
        client.post(f"/api/v1/credits/expenses/{first.json()['id']}/approve", headers=admin),
        client.post(f"/api/v1/credits/expenses/{second.json()['id']}/approve", headers=admin),
    )
    statuses = sorted(item.status_code for item in results)
    assert statuses == [200, 409]
    balances = (await client.get("/api/v1/credits/balances", headers=senior)).json()
    assert balances["service"]["available_balance"] == 500
    assert balances["service"]["available_balance"] >= 0
    history = (await client.get("/api/v1/credits/transactions", headers=senior)).json()
    deductions = [item for item in history["items"] if item["transaction_type"] == "DEDUCTION"]
    assert len(deductions) == 1
