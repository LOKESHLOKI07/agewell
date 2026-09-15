"""Shared helpers for emergency API tests against the seeded database."""

from __future__ import annotations

from httpx import AsyncClient

ACTIVE_STATUSES = {"OPEN", "ACKNOWLEDGED", "ASSIGNED", "IN_PROGRESS"}


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def close_active_emergencies(client: AsyncClient, senior_token: str, staff_token: str) -> None:
    listed = await client.get("/api/v1/emergency/", headers=auth_header(senior_token))
    assert listed.status_code == 200, listed.text
    staff = auth_header(staff_token)
    for item in listed.json().get("items", []):
        if item.get("status") not in ACTIVE_STATUSES:
            continue
        closed = await client.patch(
            f"/api/v1/emergency/{item['id']}",
            headers=staff,
            json={"status": "RESOLVED"},
        )
        assert closed.status_code == 200, closed.text


async def ensure_senior_in_service_area(client: AsyncClient, senior_id: str, admin_token: str, in_area: bool) -> None:
    payload = {
        "in_service_area": in_area,
        "address": "Kandivali West" if in_area else "Andheri West",
    }
    updated = await client.patch(
        f"/api/v1/seniors/{senior_id}",
        headers=auth_header(admin_token),
        json=payload,
    )
    assert updated.status_code == 200, updated.text
