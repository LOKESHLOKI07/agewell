import asyncio
from sqlalchemy import text
from app.db.session import AsyncSessionLocal

KEEP = ("admin@example.com", "operations@example.com")


async def refs_for(db, uid: str):
    fks = (
        await db.execute(
            text(
                """
                SELECT c.conrelid::regclass::text AS tbl,
                       pg_get_constraintdef(c.oid) AS defn
                FROM pg_constraint c
                WHERE c.contype = 'f'
                  AND confrelid::regclass::text IN ('users', 'public.users')
                """
            )
        )
    ).mappings().all()
    hits = []
    for fk in fks:
        tbl = fk["tbl"].replace("public.", "")
        defn = fk["defn"]
        col = defn.split("FOREIGN KEY (", 1)[1].split(")", 1)[0].strip().strip('"')
        n = (
            await db.execute(
                text(f"SELECT count(*) FROM {tbl} WHERE {col} = CAST(:u AS uuid)"),
                {"u": uid},
            )
        ).scalar()
        if n:
            hits.append(f"{tbl}.{col}={n}")
    return hits


async def main():
    async with AsyncSessionLocal() as db:
        rows = (
            await db.execute(
                text(
                    """
                    SELECT id::text, email FROM users
                    WHERE email ILIKE '%@example.com' AND lower(email) <> ALL(:k)
                    """
                ),
                {"k": list(KEEP)},
            )
        ).all()
        print(f"left={len(rows)}")
        for uid, email in rows:
            hits = await refs_for(db, uid)
            print(email, uid, hits or "NO FK HITS")
            # try delete with full error
            try:
                async with db.begin_nested():
                    await db.execute(text("DELETE FROM users WHERE id = CAST(:u AS uuid)"), {"u": uid})
                print("  deleted")
            except Exception as exc:  # noqa: BLE001
                print("  ERR", str(exc).split("DETAIL:")[-1][:200] if "DETAIL:" in str(exc) else str(exc)[:200])
        await db.commit()
        left = (
            await db.execute(
                text(
                    "SELECT count(*) FROM users WHERE email ILIKE '%@example.com' AND lower(email) <> ALL(:k)"
                ),
                {"k": list(KEEP)},
            )
        ).scalar()
        print("remaining", left)


asyncio.run(main())
