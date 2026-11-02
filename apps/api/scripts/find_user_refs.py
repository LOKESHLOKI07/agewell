import asyncio
from sqlalchemy import text
from app.db.session import AsyncSessionLocal

KEEP = ("admin@example.com", "operations@example.com")


async def main():
    async with AsyncSessionLocal() as db:
        uid = (
            await db.execute(
                text(
                    """
                    SELECT id::text FROM users
                    WHERE email ILIKE '%@example.com'
                      AND lower(email) <> ALL(:keep)
                    LIMIT 1
                    """
                ),
                {"keep": list(KEEP)},
            )
        ).scalar()
        print("sample user", uid)
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
                print(f"  {tbl}.{col} = {n}")


asyncio.run(main())
