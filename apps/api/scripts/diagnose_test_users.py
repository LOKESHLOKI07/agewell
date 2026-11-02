import asyncio
from sqlalchemy import text
from app.db.session import AsyncSessionLocal

KEEP = ("admin@example.com", "operations@example.com")


async def main():
    async with AsyncSessionLocal() as db:
        print(
            "users",
            (
                await db.execute(
                    text(
                        "SELECT count(*) FROM users WHERE email ILIKE '%@example.com' AND lower(email) <> ALL(:k)"
                    ),
                    {"k": list(KEEP)},
                )
            ).scalar(),
        )
        print(
            "seniors linked",
            (
                await db.execute(
                    text(
                        """
                        SELECT count(*) FROM seniors s
                        JOIN users u ON u.id = s.user_id
                        WHERE u.email ILIKE '%@example.com' AND lower(u.email) <> ALL(:k)
                        """
                    ),
                    {"k": list(KEEP)},
                )
            ).scalar(),
        )
        print(
            "cms linked",
            (
                await db.execute(
                    text(
                        """
                        SELECT count(*) FROM care_managers c
                        JOIN users u ON u.id = c.user_id
                        WHERE u.email ILIKE '%@example.com' AND lower(u.email) <> ALL(:k)
                        """
                    ),
                    {"k": list(KEEP)},
                )
            ).scalar(),
        )
        uid = (
            await db.execute(
                text(
                    "SELECT id FROM users WHERE email ILIKE '%@example.com' AND lower(email) <> ALL(:k) LIMIT 1"
                ),
                {"k": list(KEEP)},
            )
        ).scalar()
        print("try delete", uid)
        try:
            await db.execute(text("DELETE FROM users WHERE id = :u"), {"u": uid})
            await db.commit()
            print("deleted ok")
        except Exception as exc:  # noqa: BLE001
            await db.rollback()
            print(exc)


asyncio.run(main())
