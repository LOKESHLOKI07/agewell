"""Durable SOS escalation scheduler.

After create, Family + Companion are notified immediately. This module records
`escalation_due_at` on the emergency case (PostgreSQL) and runs a background
poller so a ~30s Care Manager / AgeWell Support escalation survives API
process restart.

There is no Celery/RQ worker in this repo. REDIS_URL is configured but unused
for job execution; Postgres is the source of truth. Redis is not required for
correctness.

Escalate only when:

* emergency is not RESOLVED
* emergency is not CANCELLED
* Family has not acknowledged
* Companion has not acknowledged
"""

from __future__ import annotations

import asyncio
import logging
from uuid import UUID

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.modules.access.repository import AccessRepository
from app.modules.audit.repository import AuditRepository
from app.modules.emergency.repository import EmergencyRepository
from app.modules.emergency.service import EmergencyService, _now
from app.modules.memberships.repository import MembershipRepository
from app.modules.notifications.repository import NotificationRepository
from app.modules.seniors.repository import SeniorRepository

logger = logging.getLogger(__name__)

_POLL_SECONDS = 2.0
_worker_task: asyncio.Task | None = None
_stop_event: asyncio.Event | None = None


def _service(session) -> EmergencyService:
    return EmergencyService(
        EmergencyRepository(session),
        NotificationRepository(session),
        AccessRepository(session),
        SeniorRepository(session),
        AuditRepository(session),
        MembershipRepository(session),
    )


def schedule_care_manager_escalation(case_id: UUID) -> None:
    """Fast-path timer in this process. The DB due time is the durable copy."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        logger.warning("No running event loop; durable poller will escalate %s", case_id)
        return
    loop.create_task(_run_escalation(case_id), name=f"sos-escalate-{case_id}")


async def _run_escalation(case_id: UUID) -> None:
    delay = float(getattr(settings, "SOS_FIRST_RESPONSE_ESCALATION_SECONDS", 30.0) or 0.0)
    try:
        if delay > 0:
            await asyncio.sleep(delay)
        await dispatch_due_escalation(case_id)
    except asyncio.CancelledError:
        raise
    except Exception:
        logger.exception("SOS escalation failed for case %s", case_id)


async def dispatch_due_escalation(case_id: UUID) -> bool:
    """Claim and run escalate_if_needed. Returns True when this worker claimed the job."""
    async with AsyncSessionLocal() as session:
        repo = EmergencyRepository(session)
        claimed = await repo.claim_escalation(case_id, now=_now())
        if not claimed:
            await session.rollback()
            return False
        await session.commit()

    try:
        async with AsyncSessionLocal() as session:
            await _service(session).escalate_if_needed(case_id)
        return True
    except Exception:
        async with AsyncSessionLocal() as session:
            await EmergencyRepository(session).release_escalation_claim(case_id)
            await session.commit()
        raise


async def recover_pending_escalations() -> int:
    """Startup / poller entry: escalate any due undispatched cases from Postgres."""
    try:
        async with AsyncSessionLocal() as session:
            due_ids = await EmergencyRepository(session).list_due_escalation_ids(now=_now())
    except Exception:
        logger.exception("SOS escalation due-query failed")
        return 0
    dispatched = 0
    for case_id in due_ids:
        try:
            if await dispatch_due_escalation(case_id):
                dispatched += 1
        except Exception:
            logger.exception("SOS escalation recovery failed for case %s", case_id)
    return dispatched


async def _poll_loop(stop: asyncio.Event) -> None:
    while not stop.is_set():
        try:
            await recover_pending_escalations()
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("SOS escalation poller failed")
        try:
            await asyncio.wait_for(stop.wait(), timeout=_POLL_SECONDS)
            break
        except asyncio.TimeoutError:
            continue
        except asyncio.CancelledError:
            raise


async def start_escalation_worker() -> None:
    global _worker_task, _stop_event
    if _worker_task and not _worker_task.done():
        return
    _stop_event = asyncio.Event()
    _worker_task = asyncio.create_task(_poll_loop(_stop_event), name="sos-escalation-poller")


async def stop_escalation_worker() -> None:
    global _worker_task, _stop_event
    if _stop_event:
        _stop_event.set()
    task = _worker_task
    _worker_task = None
    _stop_event = None
    if not task:
        return
    task.cancel()
    try:
        await task
    except (asyncio.CancelledError, Exception):
        pass
