"""Pytest bootstrap — never touch the demo `agewell` database.

Rewrites DATABASE_URL to `agewell_test` before app imports, creates that DB if needed,
and refuses to continue if the resolved DB name is still `agewell` (unless
ALLOW_DEMO_DB_TESTS=1 is set explicitly).
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from urllib.parse import urlparse, urlunparse

# Load .env early without importing app.core.config (which freezes settings).
_API_ROOT = Path(__file__).resolve().parents[1]
_ENV_PATH = _API_ROOT / ".env"


def _load_dotenv(path: Path) -> None:
    if not path.is_file():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


def _db_name(url: str) -> str:
    path = urlparse(url).path or ""
    return path.lstrip("/").split("/")[0].split("?")[0]


def _with_db_name(url: str, name: str) -> str:
    parsed = urlparse(url)
    return urlunparse(parsed._replace(path=f"/{name}"))


def _ensure_database(url: str, name: str) -> None:
    """Create PostgreSQL database `name` if missing (connects to `postgres`)."""
    import asyncio

    import asyncpg

    admin_url = _with_db_name(url, "postgres").replace("postgresql+asyncpg://", "postgresql://")

    async def _run() -> None:
        conn = await asyncpg.connect(admin_url)
        try:
            exists = await conn.fetchval("SELECT 1 FROM pg_database WHERE datname = $1", name)
            if not exists:
                await conn.execute(f'CREATE DATABASE "{name}"')
                print(f"[pytest] created database {name}", file=sys.stderr)
        finally:
            await conn.close()

    asyncio.run(_run())


_load_dotenv(_ENV_PATH)

_allow_demo = os.environ.get("ALLOW_DEMO_DB_TESTS", "").strip().lower() in {"1", "true", "yes"}
_base_url = os.environ.get("DATABASE_URL", "")
if not _base_url:
    raise RuntimeError("DATABASE_URL is not set; cannot run API tests.")

_current = _db_name(_base_url)
if _current == "agewell" and not _allow_demo:
    _test_url = _with_db_name(_base_url, "agewell_test")
    os.environ["DATABASE_URL"] = _test_url
    print(
        "[pytest] Using agewell_test (demo agewell is blocked). "
        "Set ALLOW_DEMO_DB_TESTS=1 only if you intentionally want the demo DB.",
        file=sys.stderr,
    )
    _ensure_database(_test_url, "agewell_test")
elif _current == "agewell" and _allow_demo:
    print("[pytest] WARNING: ALLOW_DEMO_DB_TESTS=1 — writing to demo agewell DB.", file=sys.stderr)
else:
    # Already pointed at a non-demo DB (e.g. agewell_test).
    os.environ["DATABASE_URL"] = _base_url
    if _current == "agewell_test":
        _ensure_database(_base_url, "agewell_test")

_resolved = _db_name(os.environ["DATABASE_URL"])
if _resolved == "agewell" and not _allow_demo:
    raise RuntimeError(
        "Refusing to run pytest against demo DB `agewell`. "
        "Tests will create *@example.com junk. Use agewell_test or set ALLOW_DEMO_DB_TESTS=1."
    )
