import asyncio
from sqlalchemy import text
from app.db.session import AsyncSessionLocal

KEEP = ("admin@example.com", "operations@example.com")


async def main():
    async with AsyncSessionLocal() as db:
        fks = (
            await db.execute(
                text(
                    """
                    SELECT c.conrelid::regclass::text AS tbl, pg_get_constraintdef(c.oid) AS defn
                    FROM pg_constraint c
                    WHERE c.contype = 'f'
                      AND confrelid::regclass::text IN ('location_sessions', 'public.location_sessions')
                    """
                )
            )
        ).mappings().all()
        print("children of location_sessions:")
        for fk in fks:
            print(" ", fk["tbl"], fk["defn"])
            tbl = fk["tbl"].replace("public.", "")
            defn = fk["defn"]
            col = defn.split("FOREIGN KEY (", 1)[1].split(")", 1)[0].strip().strip('"')
            n = await db.execute(
                text(
                    f"""
                    DELETE FROM {tbl}
                    WHERE {col} IN (
                      SELECT id FROM location_sessions
                      WHERE user_id IN (
                        SELECT id FROM users
                        WHERE email ILIKE '%@example.com' AND lower(email) <> ALL(:k)
                      )
                    )
                    """
                ),
                {"k": list(KEEP)},
            )
            print(f"  deleted {tbl}: {n.rowcount}")

        n = await db.execute(
            text(
                """
                DELETE FROM location_sessions
                WHERE user_id IN (
                  SELECT id FROM users
                  WHERE email ILIKE '%@example.com' AND lower(email) <> ALL(:k)
                )
                """
            ),
            {"k": list(KEEP)},
        )
        print("sessions", n.rowcount)
        n = await db.execute(
            text(
                """
                DELETE FROM users
                WHERE email ILIKE '%@example.com' AND lower(email) <> ALL(:k)
                """
            ),
            {"k": list(KEEP)},
        )
        print("users", n.rowcount)
        await db.commit()
        left = (
            await db.execute(
                text(
                    "SELECT count(*) FROM users WHERE email ILIKE '%@example.com' AND lower(email) <> ALL(:k)"
                ),
                {"k": list(KEEP)},
            )
        ).scalar()
        print("left", left)


asyncio.run(main())
