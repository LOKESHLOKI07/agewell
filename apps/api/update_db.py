import re

env_content = open(".env").read()
env_content = re.sub(r'DATABASE_URL=.*', 'DATABASE_URL=postgresql+asyncpg://postgres:admin%4077@127.0.0.1:5432/agewell', env_content)
with open(".env", "w") as f: f.write(env_content)

alembic_content = open("alembic.ini").read()
alembic_content = re.sub(r'sqlalchemy\.url = .*', 'sqlalchemy.url = postgresql+asyncpg://postgres:admin%%4077@127.0.0.1:5432/agewell', alembic_content)
with open("alembic.ini", "w") as f: f.write(alembic_content)
