import os

domains = ['families', 'access', 'care', 'visits', 'appointments', 'memberships', 'addons', 'notifications', 'community', 'orders', 'payments', 'tracking', 'healthcare', 'emergency', 'documents', 'audit']

api_v1_init = open("app/api/v1/__init__.py").read()

for domain in domains:
    schemas_path = f"app/modules/{domain}/schemas.py"
    router_path = f"app/modules/{domain}/router.py"
    
    with open(schemas_path, "w") as sf:
        sf.write(f"""from pydantic import BaseModel, UUID4
from typing import Optional, List
from datetime import datetime

class {domain.capitalize()}Response(BaseModel):
    id: UUID4
    class Config:
        from_attributes = True

class {domain.capitalize()}Create(BaseModel):
    pass
""")

    with open(router_path, "w") as rf:
        rf.write(f"""from fastapi import APIRouter
from typing import List
from .schemas import {domain.capitalize()}Response

router = APIRouter()

@router.get("/", response_model=List[{domain.capitalize()}Response])
async def list_items():
    return []
""")

    if f"{domain}_router" not in api_v1_init:
        api_v1_init = api_v1_init.replace("api_router = APIRouter()", f"from app.modules.{domain}.router import router as {domain}_router\napi_router = APIRouter()")
        api_v1_init += f"\napi_router.include_router({domain}_router, prefix='/{domain}', tags=['{domain}'])\n"

# Remove all Dummy routers from __init__ that were implemented in the first iteration
lines = api_v1_init.splitlines()
cleaned_lines = []
skip = False
for line in lines:
    if "def get_dummy" in line or "@router.get(" in line and "dummy" in line:
        continue
    if "modules = [" in line or "for mod in modules" in line or "api_router.include_router(router" in line:
        continue
    cleaned_lines.append(line)

with open("app/api/v1/__init__.py", "w") as f:
    f.write(api_v1_init)

