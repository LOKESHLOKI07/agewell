import os

file_contents = {}

file_contents['app/core/security.py'] = """from datetime import datetime, timedelta
from typing import Any, Union
from app.core.config import settings

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    # Dummy implementation for Phase 3 boundary
    return f"token_for_{subject}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return plain_password == hashed_password

def get_password_hash(password: str) -> str:
    return password
"""

file_contents['app/api/deps.py'] = """from typing import Generator, AsyncGenerator
from app.db.session import AsyncSessionLocal

async def get_db() -> AsyncGenerator:
    async with AsyncSessionLocal() as session:
        yield session
"""

# Let's fix api_router __init__ to only load real routers
file_contents['app/api/v1/__init__.py'] = """from fastapi import APIRouter

from app.modules.users.router import router as users_router
from app.modules.seniors.router import router as seniors_router
from app.modules.services.router import router as services_router

api_router = APIRouter()
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(seniors_router, prefix="/seniors", tags=["seniors"])
api_router.include_router(services_router, prefix="/services", tags=["services"])
"""

for path, content in file_contents.items():
    full_path = os.path.join(os.getcwd(), path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Core files updated")
