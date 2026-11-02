"""Ensure agewell_test exists (does not touch demo agewell data)."""

from __future__ import annotations

import asyncio
import os
from urllib.parse import urlparse, urlunparse

import asyncpg


def with_db(url: str, name: str) -> str:
    parsed = urlparse(url)
    return urlunparse(parsed._replace(path=f"/{name}"))


def load_dotenv() -> None:
    path = os.path.join(os.path.dirname(__file__), "..", ".env")
    if not os.path.isfile(path):
        return
    with open(path, encoding="utf-8") as fh:
        for raw in fh:
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


async def main() -> None:
    load_dotenv()
    base = os.environ.get("DATABASE_URL") or ""
    if not base:
        raise SystemExit("DATABASE_URL missing")
    test_url = with_db(base, "agewell_test")
    admin = with_db(base, "postgres").replace("postgresql+asyncpg://", "postgresql://")
    conn = await asyncpg.connect(admin)
    try:
        exists = await conn.fetchval("SELECT 1 FROM pg_database WHERE datname = $1", "agewell_test")
        if exists:
            print("agewell_test already exists")
        else:
            await conn.execute('CREATE DATABASE "agewell_test"')
            print("created agewell_test")
    finally:
        await conn.close()
    print("DATABASE_URL for tests:", test_url)


if __name__ == "__main__":
    asyncio.run(main())
