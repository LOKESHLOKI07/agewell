import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import subprocess
import seed

async def main():
    e = create_async_engine('postgresql+asyncpg://postgres:admin%4077@127.0.0.1:5432/agewell')
    async with e.begin() as c:
        await c.execute(text('DROP SCHEMA public CASCADE;'))
        await c.execute(text('CREATE SCHEMA public;'))
    
    subprocess.run([r".\venv\Scripts\alembic", "upgrade", "head"], shell=True, check=True)
    await seed.seed_data()

if __name__ == '__main__':
    asyncio.run(main())
