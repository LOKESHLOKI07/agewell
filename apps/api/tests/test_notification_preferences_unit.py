"""Unit tests for notification preference helpers and ACTIVE staff notify filter."""

from uuid import uuid4
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.modules.notifications.preferences import filter_push_enabled_user_ids


@pytest.mark.asyncio
async def test_filter_push_enabled_excludes_disabled_only():
    enabled = uuid4()
    disabled = uuid4()
    missing = uuid4()

    result = MagicMock()
    result.scalars.return_value.all.return_value = [disabled]
    session = MagicMock()
    session.execute = AsyncMock(return_value=result)

    allowed = await filter_push_enabled_user_ids(session, [enabled, disabled, missing, enabled])
    assert allowed == [enabled, missing]


@pytest.mark.asyncio
async def test_filter_push_enabled_empty():
    session = MagicMock()
    session.execute = AsyncMock()
    assert await filter_push_enabled_user_ids(session, []) == []
    session.execute.assert_not_awaited()
