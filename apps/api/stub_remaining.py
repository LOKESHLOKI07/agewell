import os

domains = ['families', 'access', 'care', 'visits', 'appointments', 'memberships', 'addons', 'notifications', 'community', 'orders', 'payments', 'tracking', 'healthcare', 'emergency', 'documents', 'audit']

api_v1_init = open("app/api/v1/__init__.py").read()

for domain in domains:
    code = f\"\"\"from pydantic import BaseModel, UUID4
from typing import Optional, List
from datetime import datetime

class {domain.capitalize()}Response(BaseModel):
    id: UUID4
    class Config:
        from_attributes = True

class {domain.capitalize()}Create(BaseModel):
    pass
\"\"\"
    with open(f"app/modules/{domain}/schemas.py", "w") as f: f.write(code)

    code = f\"\"\"from fastapi import APIRouter
from typing import List
from .schemas import {domain.capitalize()}Response

router = APIRouter()

@router.get("/", response_model=List[{domain.capitalize()}Response])
async def list_items():
    return []
\"\"\"
    with open(f"app/modules/{domain}/router.py", "w") as f: f.write(code)

    if f"{domain}_router" not in api_v1_init:
        api_v1_init = api_v1_init.replace('api_router = APIRouter()', f'from app.modules.{domain}.router import router as {domain}_router\napi_router = APIRouter()')
        api_v1_init += f'\napi_router.include_router({domain}_router, prefix="/{domain}", tags=["{domain}"])\n'

with open("app/api/v1/__init__.py", "w") as f: f.write(api_v1_init)
print("Finished stubbing")
