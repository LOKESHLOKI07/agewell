"""Remove pytest *@example.com users from the demo DB (keep seed admin/operations).

Usage (from apps/api):
  PYTHONPATH=. python scripts/cleanup_test_users.py
"""

from __future__ import annotations

import asyncio
import sys

from sqlalchemy import text

from app.db.session import AsyncSessionLocal

KEEP = ("admin@example.com", "operations@example.com")


async def exec_ok(db, sql: str, params: dict | None = None) -> int:
    try:
        async with db.begin_nested():
            result = await db.execute(text(sql), params or {})
            return int(result.rowcount or 0)
    except Exception as exc:  # noqa: BLE001
        print(f"  skip: {str(exc).splitlines()[0][:160]}")
        return 0


async def main() -> int:
    async with AsyncSessionLocal() as db:
        params = {"keep": list(KEEP)}
        before = (
            await db.execute(
                text(
                    """
                    SELECT count(*) FROM users
                    WHERE email ILIKE '%@example.com' AND lower(email) <> ALL(:keep)
                    """
                ),
                params,
            )
        ).scalar()
        print(f"Non-seed @example.com users: {before}")
        if not before:
            print("Nothing to delete.")
            return 0

        # Deep children that block cascade-ish cleanup.
        await exec_ok(
            db,
            """
            DELETE FROM location_points WHERE session_id IN (
              SELECT id FROM location_sessions WHERE user_id IN (
                SELECT id FROM users
                WHERE email ILIKE '%@example.com' AND lower(email) <> ALL(:keep)
              )
            )
            """,
            params,
        )
        await exec_ok(
            db,
            """
            DELETE FROM location_sessions WHERE user_id IN (
              SELECT id FROM users
              WHERE email ILIKE '%@example.com' AND lower(email) <> ALL(:keep)
            )
            """,
            params,
        )
        await exec_ok(
            db,
            """
            DELETE FROM emergency_events WHERE case_id IN (
              SELECT id FROM emergency_cases WHERE senior_id IN (
                SELECT s.id FROM seniors s
                JOIN users u ON u.id = s.user_id
                WHERE u.email ILIKE '%@example.com' AND lower(u.email) <> ALL(:keep)
              )
            )
            """,
            params,
        )
        await exec_ok(
            db,
            """
            DELETE FROM visit_tasks WHERE visit_id IN (
              SELECT v.id FROM visits v
              JOIN seniors s ON s.id = v.senior_id
              JOIN users u ON u.id = s.user_id
              WHERE u.email ILIKE '%@example.com' AND lower(u.email) <> ALL(:keep)
            )
            """,
            params,
        )

        # Null soft refs to doomed care managers / users.
        for sql in (
            """
            UPDATE seniors SET care_manager_id = NULL WHERE care_manager_id IN (
              SELECT c.id FROM care_managers c JOIN users u ON u.id = c.user_id
              WHERE u.email ILIKE '%@example.com' AND lower(u.email) <> ALL(:keep)
            )
            """,
            """
            UPDATE seniors SET companion_id = NULL WHERE companion_id IN (
              SELECT c.id FROM care_managers c JOIN users u ON u.id = c.user_id
              WHERE u.email ILIKE '%@example.com' AND lower(u.email) <> ALL(:keep)
            )
            """,
            """
            UPDATE service_requests SET dispatcher_id = NULL WHERE dispatcher_id IN (
              SELECT c.id FROM care_managers c JOIN users u ON u.id = c.user_id
              WHERE u.email ILIKE '%@example.com' AND lower(u.email) <> ALL(:keep)
            )
            """,
            """
            UPDATE service_requests SET executor_id = NULL WHERE executor_id IN (
              SELECT c.id FROM care_managers c JOIN users u ON u.id = c.user_id
              WHERE u.email ILIKE '%@example.com' AND lower(u.email) <> ALL(:keep)
            )
            """,
        ):
            await exec_ok(db, sql, params)

        # Delete FK children discovered from catalog (several rounds).
        fks = (
            await db.execute(
                text(
                    """
                    SELECT c.conrelid::regclass::text AS tbl,
                           confrelid::regclass::text AS ref,
                           pg_get_constraintdef(c.oid) AS defn
                    FROM pg_constraint c
                    WHERE c.contype = 'f'
                      AND confrelid::regclass::text IN (
                        'users', 'seniors', 'care_managers',
                        'public.users', 'public.seniors', 'public.care_managers'
                      )
                    """
                )
            )
        ).mappings().all()

        for _ in range(12):
            changed = 0
            for fk in fks:
                tbl = fk["tbl"].replace("public.", "")
                ref = fk["ref"].replace("public.", "")
                if tbl in ("users", "seniors", "care_managers"):
                    continue
                defn = fk["defn"]
                col = defn.split("FOREIGN KEY (", 1)[1].split(")", 1)[0].strip().strip('"')
                if ref == "users":
                    sql = f"""
                    DELETE FROM {tbl} WHERE {col} IN (
                      SELECT id FROM users
                      WHERE email ILIKE '%@example.com' AND lower(email) <> ALL(:keep)
                    )
                    """
                elif ref == "seniors":
                    sql = f"""
                    DELETE FROM {tbl} WHERE {col} IN (
                      SELECT s.id FROM seniors s
                      JOIN users u ON u.id = s.user_id
                      WHERE u.email ILIKE '%@example.com' AND lower(u.email) <> ALL(:keep)
                    )
                    """
                else:
                    sql = f"""
                    DELETE FROM {tbl} WHERE {col} IN (
                      SELECT c.id FROM care_managers c
                      JOIN users u ON u.id = c.user_id
                      WHERE u.email ILIKE '%@example.com' AND lower(u.email) <> ALL(:keep)
                    )
                    """
                n = await exec_ok(db, sql, params)
                changed += n
            if not changed:
                break

        for label, sql in (
            (
                "care_managers",
                """
                DELETE FROM care_managers WHERE user_id IN (
                  SELECT id FROM users
                  WHERE email ILIKE '%@example.com' AND lower(email) <> ALL(:keep)
                )
                """,
            ),
            (
                "seniors",
                """
                DELETE FROM seniors WHERE user_id IN (
                  SELECT id FROM users
                  WHERE email ILIKE '%@example.com' AND lower(email) <> ALL(:keep)
                )
                """,
            ),
            (
                "family_members",
                """
                DELETE FROM family_members WHERE user_id IN (
                  SELECT id FROM users
                  WHERE email ILIKE '%@example.com' AND lower(email) <> ALL(:keep)
                )
                """,
            ),
            (
                "users",
                """
                DELETE FROM users
                WHERE email ILIKE '%@example.com' AND lower(email) <> ALL(:keep)
                """,
            ),
        ):
            n = await exec_ok(db, sql, params)
            print(f"  deleted {label}: {n}")

        await db.commit()
        left = (
            await db.execute(
                text(
                    """
                    SELECT count(*) FROM users
                    WHERE email ILIKE '%@example.com' AND lower(email) <> ALL(:keep)
                    """
                ),
                params,
            )
        ).scalar()
        print(f"Remaining non-seed @example.com users: {left}")
        print("Kept:", ", ".join(KEEP))
        return 0 if left == 0 else 1


if __name__ == "__main__":
    try:
        raise SystemExit(asyncio.run(main()))
    except Exception as exc:  # noqa: BLE001
        print(f"FAILED: {exc}", file=sys.stderr)
        raise
