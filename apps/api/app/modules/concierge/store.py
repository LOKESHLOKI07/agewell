"""In-memory confirmation + chat session store for demo."""

from __future__ import annotations

import time
import uuid
from typing import Any

_TTL_SECONDS = 60 * 60
_confirmations: dict[str, dict[str, Any]] = {}
_sessions: dict[str, dict[str, Any]] = {}


def create_confirmation(senior_id: str, proposal: dict[str, Any]) -> str:
    confirmation_id = f"conf_{uuid.uuid4().hex[:16]}"
    _confirmations[confirmation_id] = {
        "senior_id": senior_id,
        "proposal": proposal,
        "created_at": time.time(),
        "used": False,
    }
    _prune()
    return confirmation_id


def pop_confirmation(confirmation_id: str, senior_id: str) -> dict[str, Any] | None:
    _prune()
    row = _confirmations.get(confirmation_id)
    if not row:
        return None
    if row["senior_id"] != senior_id or row["used"]:
        return None
    if time.time() - row["created_at"] > 15 * 60:
        _confirmations.pop(confirmation_id, None)
        return None
    row["used"] = True
    return row["proposal"]


def get_or_create_session(session_id: str | None, senior_id: str) -> str:
    _prune()
    if session_id and session_id in _sessions and _sessions[session_id]["senior_id"] == senior_id:
        _sessions[session_id]["updated_at"] = time.time()
        return session_id
    new_id = session_id or f"sess_{uuid.uuid4().hex[:12]}"
    _sessions[new_id] = {
        "senior_id": senior_id,
        "messages": [],
        "created_at": time.time(),
        "updated_at": time.time(),
    }
    return new_id


def get_history(session_id: str, limit: int = 12) -> list[dict[str, str]]:
    row = _sessions.get(session_id)
    if not row:
        return []
    return list(row["messages"][-limit:])


def append_turn(session_id: str, role: str, text: str) -> None:
    row = _sessions.get(session_id)
    if not row:
        return
    row["messages"].append({"role": role, "text": text})
    row["updated_at"] = time.time()
    if len(row["messages"]) > 40:
        row["messages"] = row["messages"][-40:]


def _prune() -> None:
    now = time.time()
    for key in [k for k, v in _confirmations.items() if now - v["created_at"] > 15 * 60]:
        _confirmations.pop(key, None)
    for key in [k for k, v in _sessions.items() if now - v["updated_at"] > _TTL_SECONDS]:
        _sessions.pop(key, None)
